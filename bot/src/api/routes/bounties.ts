import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bountyService } from '../../services/bounty/BountyService.js';
import { apiKeyAuth } from '../middleware/auth.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type { BountyStatus, BountySeverity, CreateBountyRequest } from '@fixflow/shared';

export const bountyRouter = Router();

/**
 * Request body schemas
 */
const createBountySchema = z.object({
  repositoryOwner: z.string().min(1),
  repositoryName: z.string().min(1),
  workflowRunId: z.string().min(1),
  workflowName: z.string().min(1),
  testName: z.string().optional(),
  failureDetails: z.string().optional(),
  amount: z.number().positive().optional(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
});

const claimBountySchema = z.object({
  prNumber: z.number().int().positive(),
  prUrl: z.string().url(),
  claimantUsername: z.string().min(1),
  walletAddress: z.string().min(25).max(35),
});

const listBountiesSchema = z.object({
  repositoryId: z.string().uuid().optional(),
  status: z.union([
    z.enum(['PENDING', 'ACTIVE', 'CLAIMED', 'ESCALATED', 'COMPLETED', 'EXPIRED', 'CANCELLED']),
    z.array(z.enum(['PENDING', 'ACTIVE', 'CLAIMED', 'ESCALATED', 'COMPLETED', 'EXPIRED', 'CANCELLED'])),
  ]).optional(),
  severity: z.union([
    z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    z.array(z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])),
  ]).optional(),
  claimedByUser: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * POST /api/bounties
 * Create a new bounty (requires API key auth)
 */
bountyRouter.post('/', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createBountySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { errors: parsed.error.errors });
    }

    const bounty = await bountyService.createBounty(parsed.data as CreateBountyRequest);
    
    res.status(201).json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bounties
 * List bounties with filters
 */
bountyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = listBountiesSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', { errors: parsed.error.errors });
    }

    const { page, limit, sortBy, sortOrder, ...filters } = parsed.data;

    const result = await bountyService.listBounties(
      filters as {
        repositoryId?: string;
        status?: BountyStatus | BountyStatus[];
        severity?: BountySeverity | BountySeverity[];
        claimedByUser?: string;
        minAmount?: number;
        maxAmount?: number;
      },
      { page, limit, sortBy, sortOrder }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bounties/:id
 * Get bounty by ID
 */
bountyRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await bountyService.getBountyById(req.params.id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }

    res.json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bounties/:id/activate
 * Activate a bounty (after funding verification)
 */
bountyRouter.post('/:id/activate', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await bountyService.activateBounty(req.params.id);
    
    res.json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bounties/:id/claim
 * Claim a bounty
 */
bountyRouter.post('/:id/claim', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = claimBountySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid request body', { errors: parsed.error.errors });
    }

    const bounty = await bountyService.claimBounty(
      req.params.id,
      parsed.data.prNumber,
      parsed.data.prUrl,
      parsed.data.claimantUsername,
      parsed.data.walletAddress
    );

    res.json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bounties/:id/unclaim
 * Unclaim a bounty (when PR is closed)
 */
bountyRouter.post('/:id/unclaim', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reason = req.body.reason || 'PR closed without merge';
    const bounty = await bountyService.unclaimBounty(req.params.id, reason);

    res.json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bounties/:id/complete
 * Complete a bounty (trigger payment)
 */
bountyRouter.post('/:id/complete', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await bountyService.completeBounty(req.params.id);

    // Trigger payment
    const { mneeService } = await import('../../services/payment/MNEEService.js');
    if (bounty.claimedByWallet) {
      await mneeService.processPayment(
        bounty.id,
        bounty.claimedByWallet,
        bounty.currentAmount
      );
    }

    res.json({
      success: true,
      data: bounty,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bounties/:id/cancel
 * Cancel a bounty
 */
bountyRouter.post('/:id/cancel', apiKeyAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bounty = await bountyService.getBountyById(req.params.id);
    
    if (!bounty) {
      throw new NotFoundError('Bounty');
    }

    // TODO: Implement cancel logic in BountyService
    res.json({
      success: true,
      message: 'Bounty cancellation not yet implemented',
    });
  } catch (error) {
    next(error);
  }
});