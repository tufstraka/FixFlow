/**
 * Bounty status in the lifecycle
 */
export enum BountyStatus {
  /** Bounty created, awaiting funding verification */
  PENDING = 'PENDING',
  /** Bounty is live and accepting claims */
  ACTIVE = 'ACTIVE',
  /** A developer has submitted a PR claiming this bounty */
  CLAIMED = 'CLAIMED',
  /** Bounty amount has increased due to time elapsed */
  ESCALATED = 'ESCALATED',
  /** Fix verified, payment processing or completed */
  COMPLETED = 'COMPLETED',
  /** Bounty exceeded maximum time without resolution */
  EXPIRED = 'EXPIRED',
  /** Bounty was cancelled by maintainer */
  CANCELLED = 'CANCELLED',
}

/**
 * Severity levels for bounties
 */
export enum BountySeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

/**
 * Bounty data structure
 */
export interface Bounty {
  id: string;
  repositoryId: string;
  githubIssueId: string | null;
  githubIssueNumber: number | null;
  workflowRunId: string;
  workflowName: string;
  status: BountyStatus;
  initialAmount: number;
  currentAmount: number;
  currency: string;
  testName: string | null;
  failureDetails: string | null;
  severity: BountySeverity;
  claimedByPr: string | null;
  claimedByPrNumber: number | null;
  claimedByUser: string | null;
  claimedByWallet: string | null;
  createdAt: Date;
  escalatedAt: Date | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date | null;
}

/**
 * Request to create a new bounty
 */
export interface CreateBountyRequest {
  repositoryOwner: string;
  repositoryName: string;
  workflowRunId: string;
  workflowName: string;
  testName?: string;
  failureDetails?: string;
  amount?: number;
  severity?: BountySeverity;
}

/**
 * Response when creating a bounty
 */
export interface CreateBountyResponse {
  bounty: Bounty;
  issueUrl: string | null;
}

/**
 * Request to claim a bounty
 */
export interface ClaimBountyRequest {
  bountyId: string;
  prNumber: number;
  prUrl: string;
  claimantUsername: string;
  walletAddress: string;
}

/**
 * Bounty escalation threshold configuration
 */
export interface EscalationThreshold {
  afterHours: number;
  increasePercent: number;
}

/**
 * Bounty filters for listing
 */
export interface BountyFilters {
  repositoryId?: string;
  status?: BountyStatus | BountyStatus[];
  severity?: BountySeverity | BountySeverity[];
  claimedByUser?: string;
  minAmount?: number;
  maxAmount?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}