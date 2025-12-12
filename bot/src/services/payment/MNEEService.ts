import Mnee from '@mnee/ts-sdk';
import { AuditEventType, PaymentStatus } from '@prisma/client';
import { prisma } from '../../db/client.js';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

/**
 * MNEEService handles all MNEE stablecoin payment operations
 */
export class MNEEService {
  private mnee: Mnee;
  private log = logger.child({ service: 'MNEEService' });

  constructor() {
    this.mnee = new Mnee({
      environment: config.mnee.environment,
      apiKey: config.mnee.apiKey,
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<{ atomicAmount: number; decimalAmount: number }> {
    try {
      const balance = await this.mnee.balance(address);
      return {
        atomicAmount: balance.atomicAmount,
        decimalAmount: balance.decimalAmount,
      };
    } catch (error) {
      this.log.error({ error, address }, 'Failed to get wallet balance');
      throw error;
    }
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(address: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(address);
    return balance.decimalAmount >= amount;
  }

  /**
   * Process payment for a completed bounty
   */
  async processPayment(
    bountyId: string,
    recipientAddress: string,
    amount: number
  ): Promise<{ ticketId: string; paymentId: string }> {
    this.log.info({ bountyId, recipientAddress, amount }, 'Processing payment');

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bountyId,
        recipientAddress,
        amount,
        currency: 'MNEE',
        status: PaymentStatus.PROCESSING,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        bountyId,
        eventType: AuditEventType.PAYMENT_INITIATED,
        eventData: {
          paymentId: payment.id,
          recipientAddress,
          amount,
        },
        actor: 'system',
        actorType: 'system',
      },
    });

    try {
      // Execute MNEE transfer
      const response = await this.mnee.transfer(
        [{ address: recipientAddress, amount }],
        config.mnee.walletWif
      );

      if (!response.ticketId) {
        throw new Error('Transfer did not return a ticket ID');
      }

      // Update payment with ticket ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          mneeTicketId: response.ticketId,
          processedAt: new Date(),
        },
      });

      this.log.info(
        { paymentId: payment.id, ticketId: response.ticketId },
        'Payment submitted to MNEE'
      );

      // Start polling for status (or rely on webhook)
      this.pollTransactionStatus(payment.id, response.ticketId).catch((error) => {
        this.log.error({ error, paymentId: payment.id }, 'Failed to poll transaction status');
      });

      return {
        ticketId: response.ticketId,
        paymentId: payment.id,
      };
    } catch (error) {
      this.log.error({ error, bountyId, paymentId: payment.id }, 'Failed to process payment');

      // Update payment as failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Create audit log for failure
      await prisma.auditLog.create({
        data: {
          bountyId,
          eventType: AuditEventType.PAYMENT_FAILED,
          eventData: {
            paymentId: payment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          actor: 'system',
          actorType: 'system',
        },
      });

      throw error;
    }
  }

  /**
   * Poll transaction status until complete
   */
  private async pollTransactionStatus(
    paymentId: string,
    ticketId: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.mnee.getTxStatus(ticketId);
        this.log.debug({ paymentId, ticketId, status: status.status }, 'Polled transaction status');

        if (status.status === 'SUCCESS' || status.status === 'MINED') {
          await this.handlePaymentComplete(paymentId, status.tx_id || '');
          return;
        }

        if (status.status === 'FAILED') {
          await this.handlePaymentFailed(paymentId, status.errors || 'Transaction failed');
          return;
        }

        // Still broadcasting, wait and retry
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      } catch (error) {
        this.log.error({ error, paymentId, ticketId, attempt }, 'Error polling transaction status');
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    this.log.warn({ paymentId, ticketId }, 'Transaction status polling timed out');
  }

  /**
   * Handle completed payment
   */
  async handlePaymentComplete(paymentId: string, txId: string): Promise<void> {
    this.log.info({ paymentId, txId }, 'Payment completed');

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        mneeTxId: txId,
        completedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        bountyId: payment.bountyId,
        eventType: AuditEventType.PAYMENT_COMPLETED,
        eventData: {
          paymentId,
          txId,
          amount: payment.amount.toString(),
          recipientAddress: payment.recipientAddress,
        },
        actor: 'system',
        actorType: 'system',
      },
    });

    // Notify on GitHub issue
    const bounty = await prisma.bounty.findUnique({
      where: { id: payment.bountyId },
      include: { repository: true },
    });

    if (bounty?.repository && bounty.githubIssueNumber) {
      // Import dynamically to avoid circular dependency
      const { githubService } = await import('../github/GitHubService.js');
      await githubService.addIssueComment(
        bounty.repository.installationId,
        bounty.repository.owner,
        bounty.repository.name,
        bounty.githubIssueNumber,
        `✅ **Payment sent!**\n\nAmount: **${payment.amount} MNEE**\nRecipient: \`${payment.recipientAddress}\`\nTransaction: \`${txId}\`\n\nThank you for contributing to this project! 🎉`
      );

      await githubService.closeIssue(
        bounty.repository.installationId,
        bounty.repository.owner,
        bounty.repository.name,
        bounty.githubIssueNumber
      );
    }
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(paymentId: string, errorMessage: string): Promise<void> {
    this.log.error({ paymentId, errorMessage }, 'Payment failed');

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        errorMessage,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        bountyId: payment.bountyId,
        eventType: AuditEventType.PAYMENT_FAILED,
        eventData: {
          paymentId,
          error: errorMessage,
        },
        actor: 'system',
        actorType: 'system',
      },
    });
  }

  /**
   * Handle MNEE webhook callback
   */
  async handleWebhook(payload: {
    ticketId: string;
    status: string;
    tx_id?: string;
    errors?: string;
  }): Promise<void> {
    this.log.info({ payload }, 'Received MNEE webhook');

    // Find payment by ticket ID
    const payment = await prisma.payment.findFirst({
      where: { mneeTicketId: payload.ticketId },
    });

    if (!payment) {
      this.log.warn({ ticketId: payload.ticketId }, 'Payment not found for webhook');
      return;
    }

    if (payload.status === 'SUCCESS' || payload.status === 'MINED') {
      await this.handlePaymentComplete(payment.id, payload.tx_id || '');
    } else if (payload.status === 'FAILED') {
      await this.handlePaymentFailed(payment.id, payload.errors || 'Transaction failed');
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string) {
    return prisma.payment.findUnique({
      where: { id: paymentId },
    });
  }

  /**
   * Get payments for a bounty
   */
  async getPaymentsForBounty(bountyId: string) {
    return prisma.payment.findMany({
      where: { bountyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Singleton instance
export const mneeService = new MNEEService();