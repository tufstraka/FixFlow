const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Bounty {
  id: string;
  repositoryId: string;
  issueNumber: number;
  title: string;
  description: string;
  amount: number;
  originalAmount: number;
  status: 'PENDING' | 'ACTIVE' | 'CLAIMED' | 'COMPLETED' | 'EXPIRED' | 'ESCALATED';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  workflowRunId: string;
  workflowName: string;
  testName?: string;
  claimedBy?: string;
  claimedAt?: string;
  claimantWallet?: string;
  completedAt?: string;
  pullRequestNumber?: number;
  expiresAt: string;
  escalationLevel: number;
  createdAt: string;
  updatedAt: string;
  repository?: Repository;
}

export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  installationId: number;
  walletAddress?: string;
  defaultBountyAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bounties: number;
  };
}

export interface Payment {
  id: string;
  bountyId: string;
  amount: number;
  recipientWallet: string;
  transactionId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
  bounty?: Bounty;
}

export interface DashboardStats {
  totalBounties: number;
  activeBounties: number;
  completedBounties: number;
  totalPaidOut: number;
  averageBountyAmount: number;
  averageResolutionTime: number;
  bountiesByStatus: Record<string, number>;
  bountiesBySeverity: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'bounty_created' | 'bounty_claimed' | 'bounty_completed' | 'payment_sent' | 'bounty_escalated';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BountyFilters {
  status?: string;
  severity?: string;
  repositoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ApiClient {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      (headers as Record<string, string>)['X-API-Key'] = this.apiKey;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard
  async getStats(): Promise<DashboardStats> {
    return this.fetch<DashboardStats>('/api/dashboard/stats');
  }

  // Bounties
  async getBounties(filters: BountyFilters = {}): Promise<PaginatedResponse<Bounty>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    return this.fetch<PaginatedResponse<Bounty>>(`/api/bounties?${params.toString()}`);
  }

  async getBounty(id: string): Promise<Bounty> {
    return this.fetch<Bounty>(`/api/bounties/${id}`);
  }

  async updateBounty(id: string, data: Partial<Bounty>): Promise<Bounty> {
    return this.fetch<Bounty>(`/api/bounties/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async cancelBounty(id: string): Promise<void> {
    return this.fetch<void>(`/api/bounties/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Repositories
  async getRepositories(): Promise<Repository[]> {
    return this.fetch<Repository[]>('/api/repositories');
  }

  async getRepository(id: string): Promise<Repository> {
    return this.fetch<Repository>(`/api/repositories/${id}`);
  }

  async updateRepository(id: string, data: Partial<Repository>): Promise<Repository> {
    return this.fetch<Repository>(`/api/repositories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getRepositoryBounties(id: string, filters: BountyFilters = {}): Promise<PaginatedResponse<Bounty>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    return this.fetch<PaginatedResponse<Bounty>>(`/api/repositories/${id}/bounties?${params.toString()}`);
  }

  async getRepositoryBalance(id: string): Promise<{ balance: number; walletAddress: string }> {
    return this.fetch<{ balance: number; walletAddress: string }>(`/api/repositories/${id}/balance`);
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return this.fetch<Payment[]>('/api/payments');
  }

  async getPayment(id: string): Promise<Payment> {
    return this.fetch<Payment>(`/api/payments/${id}`);
  }

  // Health
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    return this.fetch<{ status: string; timestamp: string }>('/api/health');
  }
}

export const api = new ApiClient();