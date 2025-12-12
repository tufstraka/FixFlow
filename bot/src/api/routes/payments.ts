import { Router, Request, Response, NextFunction } from 'express';
import { mneeService } from '../../services/payment/MNEEService.js';
import { apiKeyAuth } from '../middleware/auth.js';
import { verifyMNEEWebhook } from '../middleware/webhookVerify.js';
import { NotFoundError } from '../middleware/errorHandler.js';
import logger from '../../utils/logger.js';

export const paymentRouter = Router();

const log = logger.child({ service: 'payments' });

/**
 * GET /api/payments/:id
 * Get payment by ID
 */
paymentRouter.get('/:id', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await mneeService.getPayment(req.params.id);
    
    if (!payment) {
      throw new NotFoundError('Payment');
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        bountyId: payment.bountyId,
        recipientAddress: payment.recipientAddress,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: payment.status,
        mneeTicketId: payment.mneeTicketId,
        mneeTxId: payment.mneeTxId,
        errorMessage: payment.errorMessage,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
        completedAt: payment.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/bounty/:bountyId
 * Get all payments for a bounty
 */
paymentRouter.get('/bounty/:bountyId', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await mneeService.getPaymentsForBounty(req.params.bountyId);

    res.json({
      success: true,
      data: payments.map((payment) => ({
        id: payment.id,
        bountyId: payment.bountyId,
        recipientAddress: payment.recipientAddress,
        amount: payment.amount.toString(),
        currency: payment.currency,
        status: payment.status,
        mneeTicketId: payment.mneeTicketId,
        mneeTxId: payment.mneeTxId,
        errorMessage: payment.errorMessage,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
        completedAt: payment.completedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/webhook
 * MNEE webhook callback
 */
paymentRouter.post('/webhook', verifyMNEEWebhook, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as {
      ticketId: string;
      status: string;
      tx_id?: string;
      errors?: string;
    };

    log.info({ ticketId: payload.ticketId, status: payload.status }, 'Received MNEE webhook');

    await mneeService.handleWebhook(payload);

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});