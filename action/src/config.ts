import * as yaml from 'js-yaml';
import type { GitHub } from '@actions/github/lib/utils';

export interface BountyConfig {
  bountyConfig?: {
    defaultAmount?: number;
    currency?: string;
    severityMultipliers?: {
      critical?: number;
      high?: number;
      medium?: number;
      low?: number;
    };
    severityPatterns?: {
      critical?: string[];
      high?: string[];
      medium?: string[];
      low?: string[];
    };
    escalation?: Array<{
      afterHours: number;
      increasePercent: number;
    }>;
    maxMultiplier?: number;
    expireAfterHours?: number;
  };
}

/**
 * Get repository bounty configuration from .bounty-hunter.yml
 */
export async function getConfig(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string
): Promise<BountyConfig | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.bounty-hunter.yml',
    });

    if ('content' in data && data.type === 'file') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      const config = yaml.load(content) as BountyConfig;
      return config;
    }

    return null;
  } catch (error) {
    // File not found or other error
    return null;
  }
}