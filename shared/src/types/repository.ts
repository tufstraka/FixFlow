import { BountySeverity, EscalationThreshold } from './bounty.js';

/**
 * Repository data structure
 */
export interface Repository {
  id: string;
  githubId: string;
  owner: string;
  name: string;
  fullName: string;
  installationId: string;
  isActive: boolean;
  config: RepositoryConfig | null;
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository configuration from .bounty-hunter.yml
 */
export interface RepositoryConfig {
  bountyConfig: BountyConfig;
}

/**
 * Bounty configuration
 */
export interface BountyConfig {
  /** Base amount for new bounties in MNEE */
  defaultAmount: number;
  /** Currency (always MNEE) */
  currency: string;
  /** Severity multipliers */
  severityMultipliers: SeverityMultipliers;
  /** Test name patterns for severity detection */
  severityPatterns: SeverityPatterns;
  /** Escalation schedule */
  escalation: EscalationThreshold[];
  /** Maximum multiplier cap */
  maxMultiplier: number;
  /** Auto-expire after this many hours */
  expireAfterHours: number;
}

/**
 * Severity multipliers configuration
 */
export interface SeverityMultipliers {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * Severity patterns for automatic detection
 */
export interface SeverityPatterns {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
}

/**
 * Default bounty configuration
 */
export const DEFAULT_BOUNTY_CONFIG: BountyConfig = {
  defaultAmount: 50,
  currency: 'MNEE',
  severityMultipliers: {
    critical: 4.0,
    high: 2.0,
    medium: 1.0,
    low: 0.5,
  },
  severityPatterns: {
    critical: ['security', 'auth', 'vulnerability'],
    high: ['api', 'database', 'crash'],
    medium: [],
    low: ['style', 'lint', 'typo'],
  },
  escalation: [
    { afterHours: 24, increasePercent: 20 },
    { afterHours: 72, increasePercent: 50 },
    { afterHours: 168, increasePercent: 100 },
  ],
  maxMultiplier: 3.0,
  expireAfterHours: 336, // 2 weeks
};

/**
 * Calculate bounty amount based on severity
 */
export function calculateBountyAmount(
  baseAmount: number,
  severity: BountySeverity,
  multipliers: SeverityMultipliers
): number {
  const multiplier = multipliers[severity.toLowerCase() as keyof SeverityMultipliers] ?? 1.0;
  return Math.round(baseAmount * multiplier * 100) / 100;
}

/**
 * Detect severity from test name
 */
export function detectSeverity(
  testName: string,
  patterns: SeverityPatterns
): BountySeverity {
  const lowerTestName = testName.toLowerCase();

  for (const pattern of patterns.critical) {
    if (lowerTestName.includes(pattern.toLowerCase())) {
      return BountySeverity.CRITICAL;
    }
  }

  for (const pattern of patterns.high) {
    if (lowerTestName.includes(pattern.toLowerCase())) {
      return BountySeverity.HIGH;
    }
  }

  for (const pattern of patterns.low) {
    if (lowerTestName.includes(pattern.toLowerCase())) {
      return BountySeverity.LOW;
    }
  }

  return BountySeverity.MEDIUM;
}