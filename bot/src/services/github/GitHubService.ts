import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import config from '../../config/index.js';
import logger from '../../utils/logger.js';

interface BountyIssueData {
  id: string;
  amount: number;
  currency: string;
  workflowName: string;
  testName: string | null;
  failureDetails: string | null;
  severity: string;
}

interface CreatedIssue {
  id: number;
  number: number;
  html_url: string;
}

/**
 * GitHubService handles all GitHub App interactions
 */
export class GitHubService {
  private appAuth: ReturnType<typeof createAppAuth>;

  constructor() {
    this.appAuth = createAppAuth({
      appId: config.github.appId,
      privateKey: config.github.privateKey,
    });
  }

  /**
   * Get authenticated Octokit client for an installation
   */
  async getInstallationClient(installationId: string): Promise<Octokit> {
    const auth = await this.appAuth({
      type: 'installation',
      installationId: parseInt(installationId, 10),
    });

    return new Octokit({
      auth: auth.token,
    });
  }

  /**
   * Create a bounty issue in the repository
   */
  async createBountyIssue(
    installationId: string,
    owner: string,
    repo: string,
    bounty: BountyIssueData
  ): Promise<CreatedIssue> {
    const log = logger.child({ service: 'GitHubService', method: 'createBountyIssue' });
    const octokit = await this.getInstallationClient(installationId);

    const title = `🏆 Bounty: ${bounty.amount} ${bounty.currency} - Fix failing ${bounty.workflowName}`;
    const body = this.generateBountyIssueBody(bounty);
    const labels = ['bounty', `severity:${bounty.severity.toLowerCase()}`];

    try {
      const { data: issue } = await octokit.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
      });

      log.info({ issueNumber: issue.number, owner, repo }, 'Created bounty issue');

      return {
        id: issue.id,
        number: issue.number,
        html_url: issue.html_url,
      };
    } catch (error) {
      log.error({ error, owner, repo }, 'Failed to create bounty issue');
      throw error;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addIssueComment(
    installationId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<void> {
    const log = logger.child({ service: 'GitHubService', method: 'addIssueComment' });
    const octokit = await this.getInstallationClient(installationId);

    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
      });
      log.debug({ issueNumber, owner, repo }, 'Added issue comment');
    } catch (error) {
      log.error({ error, issueNumber, owner, repo }, 'Failed to add issue comment');
      throw error;
    }
  }

  /**
   * Close an issue with a comment
   */
  async closeIssue(
    installationId: string,
    owner: string,
    repo: string,
    issueNumber: number,
    comment?: string
  ): Promise<void> {
    const log = logger.child({ service: 'GitHubService', method: 'closeIssue' });
    const octokit = await this.getInstallationClient(installationId);

    try {
      if (comment) {
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: comment,
        });
      }

      await octokit.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        state: 'closed',
      });

      log.info({ issueNumber, owner, repo }, 'Closed issue');
    } catch (error) {
      log.error({ error, issueNumber, owner, repo }, 'Failed to close issue');
      throw error;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    installationId: string,
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string | null> {
    const log = logger.child({ service: 'GitHubService', method: 'getFileContent' });
    const octokit = await this.getInstallationClient(installationId);

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      if ('content' in data && data.type === 'file') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      log.error({ error, owner, repo, path }, 'Failed to get file content');
      throw error;
    }
  }

  /**
   * Trigger a workflow re-run
   */
  async rerunWorkflow(
    installationId: string,
    owner: string,
    repo: string,
    runId: number
  ): Promise<void> {
    const log = logger.child({ service: 'GitHubService', method: 'rerunWorkflow' });
    const octokit = await this.getInstallationClient(installationId);

    try {
      await octokit.actions.reRunWorkflow({
        owner,
        repo,
        run_id: runId,
      });
      log.info({ runId, owner, repo }, 'Triggered workflow re-run');
    } catch (error) {
      log.error({ error, runId, owner, repo }, 'Failed to trigger workflow re-run');
      throw error;
    }
  }

  /**
   * Get workflow run details
   */
  async getWorkflowRun(
    installationId: string,
    owner: string,
    repo: string,
    runId: number
  ) {
    const octokit = await this.getInstallationClient(installationId);

    const { data } = await octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });

    return data;
  }

  /**
   * Get pull request details
   */
  async getPullRequest(
    installationId: string,
    owner: string,
    repo: string,
    prNumber: number
  ) {
    const octokit = await this.getInstallationClient(installationId);

    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return data;
  }

  /**
   * Generate bounty issue body
   */
  private generateBountyIssueBody(bounty: BountyIssueData): string {
    const testInfo = bounty.testName 
      ? `\n### Failing Test\n\`${bounty.testName}\``
      : '';

    const failureInfo = bounty.failureDetails
      ? `\n### Failure Details\n\`\`\`\n${bounty.failureDetails}\n\`\`\``
      : '';

    return `## 🏆 Bounty Available

**Amount:** ${bounty.amount} ${bounty.currency}
**Severity:** ${bounty.severity}
**Workflow:** ${bounty.workflowName}
${testInfo}
${failureInfo}

---

### How to Claim This Bounty

1. **Fork this repository** and fix the failing test
2. **Submit a Pull Request** with your fix
3. **Comment on this issue** with: \`/claim <your-wallet-address>\`
4. Once your PR is merged and tests pass, payment will be released automatically

### Requirements

- Your fix must make the failing test pass
- The PR must be merged by a maintainer
- You must provide a valid MNEE wallet address

### Bounty Rules

- First valid fix wins
- Bounty amount may increase over time if unclaimed
- Bounty expires if not claimed within the time limit

---

*Powered by [FixFlow](https://github.com/fixflow) - Automated bounties for open-source*

<!-- bounty-id: ${bounty.id} -->
`;
  }
}

// Singleton instance
export const githubService = new GitHubService();