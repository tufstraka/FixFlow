export interface CreateBountyRequest {
  repositoryOwner: string;
  repositoryName: string;
  workflowRunId: string;
  workflowName: string;
  testName?: string;
  failureDetails?: string;
  amount?: number;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BountyResponse {
  id: string;
  repositoryId: string;
  githubIssueId: string | null;
  githubIssueNumber: number | null;
  workflowRunId: string;
  workflowName: string;
  status: string;
  severity: string;
  initialAmount: number;
  currentAmount: number;
  currency: string;
  testName: string | null;
  failureDetails: string | null;
  claimedByPr: string | null;
  claimedByPrNumber: number | null;
  claimedByUser: string | null;
  claimedByWallet: string | null;
  createdAt: string;
  escalatedAt: string | null;
  claimedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    error: string;
    message: string;
    statusCode: number;
  };
}

/**
 * Create a bounty via the bot server API
 */
export async function createBounty(
  serverUrl: string,
  apiKey: string,
  request: CreateBountyRequest
): Promise<BountyResponse> {
  const url = `${serverUrl.replace(/\/$/, '')}/api/bounties`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  const data = await response.json() as ApiResponse<BountyResponse>;

  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Failed to create bounty: ${errorMessage}`);
  }

  if (!data.data) {
    throw new Error('No bounty data in response');
  }

  return data.data;
}

/**
 * Activate a bounty via the bot server API
 */
export async function activateBounty(
  serverUrl: string,
  apiKey: string,
  bountyId: string
): Promise<BountyResponse> {
  const url = `${serverUrl.replace(/\/$/, '')}/api/bounties/${bountyId}/activate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json() as ApiResponse<BountyResponse>;

  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Failed to activate bounty: ${errorMessage}`);
  }

  if (!data.data) {
    throw new Error('No bounty data in response');
  }

  return data.data;
}

/**
 * Get bounty by ID
 */
export async function getBounty(
  serverUrl: string,
  apiKey: string,
  bountyId: string
): Promise<BountyResponse> {
  const url = `${serverUrl.replace(/\/$/, '')}/api/bounties/${bountyId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  const data = await response.json() as ApiResponse<BountyResponse>;

  if (!response.ok || !data.success) {
    const errorMessage = data.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`Failed to get bounty: ${errorMessage}`);
  }

  if (!data.data) {
    throw new Error('No bounty data in response');
  }

  return data.data;
}