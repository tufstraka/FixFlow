import { Prisma, BountyStatus, BountySeverity, AuditEventType } from '@prisma/client';
import { prisma } from '../../db/client.js';
import logger from '../../utils/logger.js';
import type {
  Bounty,
  CreateBountyRequest,
  BountyFilters,
  PaginationOptions,
  PaginatedResponse,
} from '@fixflow/shared';
import { DEFAULT_BOUNTY_CONFIG, detectSeverity, calculateBountyAmount } from '@fixflow/shared';
import { GitHubService } from '../github/GitHubService.js';

/**
 * Valid state transitions for bounties
 */
const VALID_TRANSITIONS: Record<BountyStatus, BountyStatus[]> = {
  [BountyStatus.PENDING]: [BountyStatus.ACTIVE, BountyStatus.CANCELLED],
  [BountyStatus.ACTIVE]: [BountyStatus.CLAIMED, BountyStatus.ESCALATED, BountyStatus.EXPIRED, BountyStatus.CANCELLED],
  [BountyStatus.CLAIMED]: [BountyStatus.ACTIVE, BountyStatus.COMPLETED, BountyStatus.CANCELLED],
  [BountyStatus.ESCALATED]: [BountyStatus.CLAIMED, BountyStatus.EXPIRED, BountyStatus.CANCELLED],
  [BountyStatus.COMPLETED]: [],
  [BountyStatus.EXPIRED]: [],
  [BountyStatus.CANCELLED]: [],
};

/**
 * BountyService handles all bounty-related business logic
 */
export class BountyService {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  /**
   * Create a new bounty
   */
  async createBounty(request: CreateBountyRequest): Promise<Bounty> {
    const log = logger.child({ service: 'BountyService', method: 'createBounty' });
    log.info({ request }, 'Creating bounty');

    // Find or create repository
    const repository = await prisma.repository.findFirst({
      where: {
        owner: request.repositoryOwner,
        name: request.repositoryName,
      },
    });

    if (!repository) {
      throw new Error(`Repository ${request.repositoryOwner}/${request.repositoryName} not found. Install the FixFlow app first.`);
    }

    // Get repository config or use defaults
    const config = (repository.config as unknown as { bountyConfig?: typeof DEFAULT_BOUNTY_CONFIG })?.bountyConfig ?? DEFAULT_BOUNTY_CONFIG;

    // Detect severity from test name
    const severity = request.severity ?? 
      (request.testName ? detectSeverity(request.testName, config.severityPatterns) : BountySeverity.MEDIUM);

    // Calculate bounty amount
    const baseAmount = request.amount ?? config.defaultAmount;
    const amount = calculateBountyAmount(baseAmount, severity, config.severityMultipliers);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + config.expireAfterHours);

    // Create bounty
    const bounty = await prisma.bounty.create({
      data: {
        repositoryId: repository.id,
        workflowRunId: request.workflowRunId,
        workflowName: request.workflowName,
        status: BountyStatus.PENDING,
        severity: severity as BountySeverity,
        initialAmount: new Prisma.Decimal(amount),
        currentAmount: new Prisma.Decimal(amount),
        currency: 'MNEE',
        testName: request.testName ?? null,
        failureDetails: request.failureDetails ?? null,
        expiresAt,
      },
    });

    // Create audit log
    await this.createAuditLog(
      bounty.id,
      AuditEventType.BOUNTY_CREATED,
      { request, amount, severity },
      'system'
    );

    log.info({ bountyId: bounty.id, amount }, 'Bounty created');

    return this.toBountyResponse(bounty);
  }

  /**
   * Activate a bounty (after funding verification)
   */
  async activateBounty(bountyId: string): Promise<Bounty> {
    const bounty = await this.getBountyById(bountyId);
    
    if (!bounty) {
      throw new Error('Bounty not found');
    }

    this.validateTransition(bounty.status as BountyStatus, BountyStatus.ACTIVE);

    // Get repository for GitHub issue creation
    const repository = await prisma.repository.findUnique({
      where: { id: bounty.repositoryId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    // Create GitHub issue
    const issue = await this.githubService.createBountyIssue(
      repository.installationId,
      repository.owner,
      repository.name,
      {
        id: bounty.id,
        amount: Number(bounty.currentAmount),
        currency: bounty.currency,
        workflowName: bounty.workflowName,
        testName: bounty.testName,
        failureDetails: bounty.failureDetails,
        severity: bounty.severity,
      }
    );

    // Update bounty with issue info
    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ACTIVE,
        githubIssueId: issue.id.toString(),
        githubIssueNumber: issue.number,
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_ACTIVATED,
      { issueNumber: issue.number, issueUrl: issue.html_url },
      'system'
    );

    return this.toBountyResponse(updated);
  }

  /**
   * Claim a bounty
   */
  async claimBounty(
    bountyId: string,
    prNumber: number,
    prUrl: string,
    claimantUsername: string,
    walletAddress: string
  ): Promise<Bounty> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    // Can claim from ACTIVE or ESCALATED
    if (bounty.status !== BountyStatus.ACTIVE && bounty.status !== BountyStatus.ESCALATED) {
      throw new Error(`Cannot claim bounty in ${bounty.status} status`);
    }

    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.CLAIMED,
        claimedByPr: prUrl,
        claimedByPrNumber: prNumber,
        claimedByUser: claimantUsername,
        claimedByWallet: walletAddress,
        claimedAt: new Date(),
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_CLAIMED,
      { prNumber, prUrl, claimantUsername, walletAddress },
      claimantUsername
    );

    // Add comment to the GitHub issue
    const repository = await prisma.repository.findUnique({
      where: { id: bounty.repositoryId },
    });

    if (repository && bounty.githubIssueNumber) {
      await this.githubService.addIssueComment(
        repository.installationId,
        repository.owner,
        repository.name,
        bounty.githubIssueNumber,
        `🎯 **Bounty claimed by @${claimantUsername}**\n\nPR: #${prNumber}\nWallet: \`${walletAddress}\`\n\nPayment will be released when the fix is verified and merged.`
      );
    }

    return this.toBountyResponse(updated);
  }

  /**
   * Unclaim a bounty (when PR is closed without merge)
   */
  async unclaimBounty(bountyId: string, reason: string): Promise<Bounty> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    if (bounty.status !== BountyStatus.CLAIMED) {
      throw new Error('Bounty is not claimed');
    }

    const previousClaimant = bounty.claimedByUser;

    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ACTIVE,
        claimedByPr: null,
        claimedByPrNumber: null,
        claimedByUser: null,
        claimedByWallet: null,
        claimedAt: null,
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_UNCLAIMED,
      { reason, previousClaimant },
      'system'
    );

    return this.toBountyResponse(updated);
  }

  /**
   * Complete a bounty (after PR merge and test pass)
   */
  async completeBounty(bountyId: string): Promise<Bounty> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    this.validateTransition(bounty.status, BountyStatus.COMPLETED);

    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_COMPLETED,
      { 
        claimant: bounty.claimedByUser,
        amount: bounty.currentAmount.toString(),
        wallet: bounty.claimedByWallet,
      },
      'system'
    );

    return this.toBountyResponse(updated);
  }

  /**
   * Escalate a bounty (increase amount due to time)
   */
  async escalateBounty(bountyId: string, newAmount: number): Promise<Bounty> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    this.validateTransition(bounty.status, BountyStatus.ESCALATED);

    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.ESCALATED,
        currentAmount: new Prisma.Decimal(newAmount),
        escalatedAt: new Date(),
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_ESCALATED,
      { 
        previousAmount: bounty.currentAmount.toString(),
        newAmount: newAmount.toString(),
      },
      'system'
    );

    // Update GitHub issue with new amount
    const repository = await prisma.repository.findUnique({
      where: { id: bounty.repositoryId },
    });

    if (repository && bounty.githubIssueNumber) {
      await this.githubService.addIssueComment(
        repository.installationId,
        repository.owner,
        repository.name,
        bounty.githubIssueNumber,
        `⬆️ **Bounty escalated!**\n\nNew amount: **${newAmount} ${bounty.currency}** (was ${bounty.currentAmount} ${bounty.currency})`
      );
    }

    return this.toBountyResponse(updated);
  }

  /**
   * Expire a bounty
   */
  async expireBounty(bountyId: string): Promise<Bounty> {
    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
    });

    if (!bounty) {
      throw new Error('Bounty not found');
    }

    this.validateTransition(bounty.status, BountyStatus.EXPIRED);

    const updated = await prisma.bounty.update({
      where: { id: bountyId },
      data: {
        status: BountyStatus.EXPIRED,
      },
    });

    await this.createAuditLog(
      bountyId,
      AuditEventType.BOUNTY_EXPIRED,
      {},
      'system'
    );

    // Close GitHub issue
    const repository = await prisma.repository.findUnique({
      where: { id: bounty.repositoryId },
    });

    if (repository && bounty.githubIssueNumber) {
      await this.githubService.closeIssue(
        repository.installationId,
        repository.owner,
        repository.name,
        bounty.githubIssueNumber,
        '⏰ This bounty has expired without being claimed.'
      );
    }

    return this.toBountyResponse(updated);
  }

  /**
   * Get bounty by ID
   */
  async getBountyById(bountyId: string) {
    return prisma.bounty.findUnique({
      where: { id: bountyId },
    });
  }

  /**
   * Get bounty by GitHub issue number
   */
  async getBountyByIssueNumber(repositoryId: string, issueNumber: number) {
    return prisma.bounty.findFirst({
      where: {
        repositoryId,
        githubIssueNumber: issueNumber,
      },
    });
  }

  /**
   * Get bounty by workflow run ID
   */
  async getBountyByWorkflowRun(repositoryId: string, workflowRunId: string) {
    return prisma.bounty.findFirst({
      where: {
        repositoryId,
        workflowRunId,
      },
    });
  }

  /**
   * List bounties with filters and pagination
   */
  async listBounties(
    filters: BountyFilters,
    pagination: PaginationOptions
  ): Promise<PaginatedResponse<Bounty>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BountyWhereInput = {};

    if (filters.repositoryId) {
      where.repositoryId = filters.repositoryId;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status) 
        ? { in: filters.status as BountyStatus[] }
        : filters.status as BountyStatus;
    }

    if (filters.severity) {
      where.severity = Array.isArray(filters.severity)
        ? { in: filters.severity as BountySeverity[] }
        : filters.severity as BountySeverity;
    }

    if (filters.claimedByUser) {
      where.claimedByUser = filters.claimedByUser;
    }

    if (filters.minAmount !== undefined) {
      where.currentAmount = { ...where.currentAmount as object, gte: filters.minAmount };
    }

    if (filters.maxAmount !== undefined) {
      where.currentAmount = { ...where.currentAmount as object, lte: filters.maxAmount };
    }

    if (filters.createdAfter) {
      where.createdAt = { ...where.createdAt as object, gte: filters.createdAfter };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt as object, lte: filters.createdBefore };
    }

    const [bounties, total] = await Promise.all([
      prisma.bounty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [pagination.sortBy ?? 'createdAt']: pagination.sortOrder ?? 'desc' },
      }),
      prisma.bounty.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: bounties.map(this.toBountyResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get bounties ready for escalation
   */
  async getBountiesForEscalation(): Promise<Array<{ bounty: Bounty; nextEscalation: number }>> {
    const activeBounties = await prisma.bounty.findMany({
      where: {
        status: { in: [BountyStatus.ACTIVE, BountyStatus.ESCALATED] },
      },
      include: {
        repository: true,
      },
    });

    const result: Array<{ bounty: Bounty; nextEscalation: number }> = [];

    for (const bounty of activeBounties) {
      const config = (bounty.repository.config as unknown as { bountyConfig?: typeof DEFAULT_BOUNTY_CONFIG })?.bountyConfig ?? DEFAULT_BOUNTY_CONFIG;
      const hoursElapsed = (Date.now() - bounty.createdAt.getTime()) / (1000 * 60 * 60);

      // Find next escalation threshold
      for (const threshold of config.escalation) {
        if (hoursElapsed >= threshold.afterHours) {
          const newAmount = Number(bounty.initialAmount) * (1 + threshold.increasePercent / 100);
          const cappedAmount = Math.min(newAmount, Number(bounty.initialAmount) * config.maxMultiplier);
          
          if (cappedAmount > Number(bounty.currentAmount)) {
            result.push({
              bounty: this.toBountyResponse(bounty),
              nextEscalation: cappedAmount,
            });
          }
        }
      }
    }

    return result;
  }

  /**
   * Get expired bounties
   */
  async getExpiredBounties(): Promise<Bounty[]> {
    const now = new Date();
    const expired = await prisma.bounty.findMany({
      where: {
        status: { in: [BountyStatus.ACTIVE, BountyStatus.ESCALATED] },
        expiresAt: { lte: now },
      },
    });

    return expired.map(this.toBountyResponse);
  }

  /**
   * Validate state transition
   */
  private validateTransition(from: BountyStatus, to: BountyStatus): void {
    const validTargets = VALID_TRANSITIONS[from];
    if (!validTargets?.includes(to)) {
      throw new Error(`Invalid state transition from ${from} to ${to}`);
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    bountyId: string | null,
    eventType: AuditEventType,
    eventData: Record<string, unknown>,
    actor: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        bountyId,
        eventType,
        eventData,
        actor,
        actorType: actor === 'system' ? 'system' : 'user',
      },
    });
  }

  /**
   * Convert Prisma model to API response
   */
  private toBountyResponse(bounty: Prisma.BountyGetPayload<object>): Bounty {
    return {
      id: bounty.id,
      repositoryId: bounty.repositoryId,
      githubIssueId: bounty.githubIssueId,
      githubIssueNumber: bounty.githubIssueNumber,
      workflowRunId: bounty.workflowRunId,
      workflowName: bounty.workflowName,
      status: bounty.status as Bounty['status'],
      severity: bounty.severity as Bounty['severity'],
      initialAmount: Number(bounty.initialAmount),
      currentAmount: Number(bounty.currentAmount),
      currency: bounty.currency,
      testName: bounty.testName,
      failureDetails: bounty.failureDetails,
      claimedByPr: bounty.claimedByPr,
      claimedByPrNumber: bounty.claimedByPrNumber,
      claimedByUser: bounty.claimedByUser,
      claimedByWallet: bounty.claimedByWallet,
      createdAt: bounty.createdAt,
      escalatedAt: bounty.escalatedAt,
      claimedAt: bounty.claimedAt,
      completedAt: bounty.completedAt,
      expiresAt: bounty.expiresAt,
    };
  }
}

// Singleton instance
export const bountyService = new BountyService();