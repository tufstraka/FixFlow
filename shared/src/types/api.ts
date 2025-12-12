/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

/**
 * API success response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    github: 'connected' | 'disconnected';
    mnee: 'connected' | 'disconnected';
  };
}

/**
 * GitHub webhook event types we handle
 */
export type GitHubWebhookEvent =
  | 'workflow_run'
  | 'pull_request'
  | 'issue_comment'
  | 'installation'
  | 'installation_repositories';

/**
 * Webhook payload base
 */
export interface WebhookPayloadBase {
  action: string;
  sender: {
    login: string;
    id: number;
  };
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
  installation?: {
    id: number;
  };
}

/**
 * Workflow run webhook payload
 */
export interface WorkflowRunPayload extends WebhookPayloadBase {
  action: 'completed' | 'requested' | 'in_progress';
  workflow_run: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
    html_url: string;
    created_at: string;
    updated_at: string;
    pull_requests: Array<{
      number: number;
      head: {
        ref: string;
        sha: string;
      };
    }>;
  };
  workflow: {
    id: number;
    name: string;
  };
}

/**
 * Pull request webhook payload
 */
export interface PullRequestPayload extends WebhookPayloadBase {
  action: 'opened' | 'closed' | 'synchronize' | 'reopened' | 'edited';
  number: number;
  pull_request: {
    id: number;
    number: number;
    state: 'open' | 'closed';
    title: string;
    body: string | null;
    merged: boolean;
    merged_at: string | null;
    merge_commit_sha: string | null;
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
      sha: string;
    };
    user: {
      login: string;
      id: number;
    };
    html_url: string;
  };
}

/**
 * Issue comment webhook payload
 */
export interface IssueCommentPayload extends WebhookPayloadBase {
  action: 'created' | 'edited' | 'deleted';
  issue: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    state: 'open' | 'closed';
    labels: Array<{
      name: string;
    }>;
    user: {
      login: string;
      id: number;
    };
    html_url: string;
  };
  comment: {
    id: number;
    body: string;
    user: {
      login: string;
      id: number;
    };
    created_at: string;
    html_url: string;
  };
}

/**
 * Installation webhook payload
 */
export interface InstallationPayload extends WebhookPayloadBase {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend';
  installation: {
    id: number;
    account: {
      login: string;
      id: number;
      type: 'User' | 'Organization';
    };
    repository_selection: 'all' | 'selected';
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
  }>;
}

/**
 * Claim command parsed from issue comment
 */
export interface ClaimCommand {
  walletAddress: string;
  prNumber?: number;
}

/**
 * Parse claim command from comment body
 * Format: /claim <wallet-address> [PR #number]
 */
export function parseClaimCommand(body: string): ClaimCommand | null {
  const claimRegex = /\/claim\s+([A-Za-z0-9]{25,35})(?:\s+(?:#|PR\s*)(\d+))?/i;
  const match = body.match(claimRegex);

  if (!match) {
    return null;
  }

  return {
    walletAddress: match[1]!,
    prNumber: match[2] ? parseInt(match[2], 10) : undefined,
  };
}