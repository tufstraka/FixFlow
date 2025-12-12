import { Router, Request, Response, NextFunction } from 'express';
import { verifyGitHubWebhook } from '../middleware/webhookVerify.js';
import { bountyService } from '../../services/bounty/BountyService.js';
import { prisma } from '../../db/client.js';
import logger from '../../utils/logger.js';
import {
  parseClaimCommand,
  type WorkflowRunPayload,
  type PullRequestPayload,
  type IssueCommentPayload,
  type InstallationPayload,
} from '@fixflow/shared';

export const webhookRouter = Router();

const log = logger.child({ service: 'webhooks' });

/**
 * POST /api/webhooks/github
 * Handle GitHub webhooks
 */
webhookRouter.post('/github', verifyGitHubWebhook, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const payload = req.body as unknown;

    log.info({ event, action: (payload as { action?: string }).action }, 'Received GitHub webhook');

    switch (event) {
      case 'workflow_run':
        await handleWorkflowRun(payload as WorkflowRunPayload);
        break;
      case 'pull_request':
        await handlePullRequest(payload as PullRequestPayload);
        break;
      case 'issue_comment':
        await handleIssueComment(payload as IssueCommentPayload);
        break;
      case 'installation':
        await handleInstallation(payload as InstallationPayload);
        break;
      case 'installation_repositories':
        await handleInstallationRepositories(payload as InstallationPayload);
        break;
      default:
        log.debug({ event }, 'Unhandled webhook event');
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
});

/**
 * Handle workflow_run events
 * Creates bounty when tests fail
 */
async function handleWorkflowRun(payload: WorkflowRunPayload): Promise<void> {
  const { action, workflow_run, repository, installation } = payload;

  if (!repository || !installation) {
    log.warn('Missing repository or installation in workflow_run payload');
    return;
  }

  // Only handle completed workflow runs
  if (action !== 'completed') {
    return;
  }

  // Only create bounty for failed workflows
  if (workflow_run.conclusion !== 'failure') {
    log.debug({ conclusion: workflow_run.conclusion }, 'Workflow did not fail, skipping');
    return;
  }

  // Find repository in our database
  const repo = await prisma.repository.findUnique({
    where: { githubId: repository.id.toString() },
  });

  if (!repo) {
    log.warn({ repoId: repository.id }, 'Repository not found in database');
    return;
  }

  // Check if bounty already exists for this workflow run
  const existingBounty = await bountyService.getBountyByWorkflowRun(
    repo.id,
    workflow_run.id.toString()
  );

  if (existingBounty) {
    log.info({ bountyId: existingBounty.id }, 'Bounty already exists for this workflow run');
    return;
  }

  // Create bounty
  try {
    const bounty = await bountyService.createBounty({
      repositoryOwner: repository.owner.login,
      repositoryName: repository.name,
      workflowRunId: workflow_run.id.toString(),
      workflowName: workflow_run.name,
      failureDetails: `Workflow "${workflow_run.name}" failed on branch ${workflow_run.head_branch}`,
    });

    // Activate bounty immediately (assumes funding is available)
    await bountyService.activateBounty(bounty.id);

    log.info({ bountyId: bounty.id }, 'Created and activated bounty for failed workflow');
  } catch (error) {
    log.error({ error, workflowRunId: workflow_run.id }, 'Failed to create bounty');
  }
}

/**
 * Handle pull_request events
 * Completes bounty when PR is merged
 */
async function handlePullRequest(payload: PullRequestPayload): Promise<void> {
  const { action, pull_request, repository, installation } = payload;

  if (!repository || !installation) {
    return;
  }

  // Only handle closed PRs that were merged
  if (action !== 'closed' || !pull_request.merged) {
    // If PR is closed without merge, unclaim the bounty
    if (action === 'closed' && !pull_request.merged) {
      await handlePRClosedWithoutMerge(payload);
    }
    return;
  }

  // Find repository
  const repo = await prisma.repository.findUnique({
    where: { githubId: repository.id.toString() },
  });

  if (!repo) {
    return;
  }

  // Find bounty claimed by this PR
  const bounty = await prisma.bounty.findFirst({
    where: {
      repositoryId: repo.id,
      claimedByPrNumber: pull_request.number,
      status: 'CLAIMED',
    },
  });

  if (!bounty) {
    log.debug({ prNumber: pull_request.number }, 'No claimed bounty found for merged PR');
    return;
  }

  // Complete the bounty (this will trigger payment)
  try {
    await bountyService.completeBounty(bounty.id);
    
    // Process payment
    const { mneeService } = await import('../../services/payment/MNEEService.js');
    if (bounty.claimedByWallet) {
      await mneeService.processPayment(
        bounty.id,
        bounty.claimedByWallet,
        Number(bounty.currentAmount)
      );
    }

    log.info({ bountyId: bounty.id, prNumber: pull_request.number }, 'Completed bounty for merged PR');
  } catch (error) {
    log.error({ error, bountyId: bounty.id }, 'Failed to complete bounty');
  }
}

/**
 * Handle PR closed without merge
 */
async function handlePRClosedWithoutMerge(payload: PullRequestPayload): Promise<void> {
  const { pull_request, repository } = payload;

  if (!repository) {
    return;
  }

  const repo = await prisma.repository.findUnique({
    where: { githubId: repository.id.toString() },
  });

  if (!repo) {
    return;
  }

  // Find bounty claimed by this PR
  const bounty = await prisma.bounty.findFirst({
    where: {
      repositoryId: repo.id,
      claimedByPrNumber: pull_request.number,
      status: 'CLAIMED',
    },
  });

  if (bounty) {
    await bountyService.unclaimBounty(bounty.id, 'PR closed without merge');
    log.info({ bountyId: bounty.id }, 'Unclaimed bounty due to PR being closed');
  }
}

/**
 * Handle issue_comment events
 * Processes /claim commands
 */
async function handleIssueComment(payload: IssueCommentPayload): Promise<void> {
  const { action, issue, comment, repository, installation } = payload;

  if (!repository || !installation) {
    return;
  }

  // Only handle new comments
  if (action !== 'created') {
    return;
  }

  // Check if comment contains claim command
  const claimCommand = parseClaimCommand(comment.body);
  if (!claimCommand) {
    return;
  }

  log.info(
    { issueNumber: issue.number, claimant: comment.user.login, walletAddress: claimCommand.walletAddress },
    'Processing claim command'
  );

  // Find repository
  const repo = await prisma.repository.findUnique({
    where: { githubId: repository.id.toString() },
  });

  if (!repo) {
    log.warn({ repoId: repository.id }, 'Repository not found');
    return;
  }

  // Find bounty by issue number
  const bounty = await bountyService.getBountyByIssueNumber(repo.id, issue.number);

  if (!bounty) {
    log.warn({ issueNumber: issue.number }, 'No bounty found for issue');
    // Could add a comment to the issue indicating no bounty
    return;
  }

  // Check if bounty is claimable
  if (bounty.status !== 'ACTIVE' && bounty.status !== 'ESCALATED') {
    log.info({ bountyId: bounty.id, status: bounty.status }, 'Bounty is not claimable');
    // TODO: Add comment to issue explaining bounty status
    return;
  }

  // Need a PR number to claim
  if (!claimCommand.prNumber) {
    log.warn('No PR number provided in claim command');
    // TODO: Add comment asking for PR number
    return;
  }

  // Verify the PR exists and is open
  const { githubService } = await import('../../services/github/GitHubService.js');
  try {
    const pr = await githubService.getPullRequest(
      repo.installationId,
      repo.owner,
      repo.name,
      claimCommand.prNumber
    );

    if (pr.state !== 'open') {
      log.warn({ prNumber: claimCommand.prNumber, state: pr.state }, 'PR is not open');
      return;
    }

    // Claim the bounty
    await bountyService.claimBounty(
      bounty.id,
      claimCommand.prNumber,
      pr.html_url,
      comment.user.login,
      claimCommand.walletAddress
    );

    log.info({ bountyId: bounty.id, claimant: comment.user.login }, 'Bounty claimed successfully');
  } catch (error) {
    log.error({ error, prNumber: claimCommand.prNumber }, 'Failed to process claim');
  }
}

/**
 * Handle installation events
 * Sets up or removes repositories when app is installed/uninstalled
 */
async function handleInstallation(payload: InstallationPayload): Promise<void> {
  const { action, installation, repositories } = payload;

  log.info({ action, installationId: installation.id }, 'Processing installation event');

  if (action === 'created') {
    // App was installed, register repositories
    if (repositories) {
      for (const repo of repositories) {
        await registerRepository(
          repo.id.toString(),
          repo.full_name.split('/')[0]!,
          repo.full_name.split('/')[1]!,
          repo.full_name,
          installation.id.toString()
        );
      }
    }
  } else if (action === 'deleted') {
    // App was uninstalled, mark repositories as inactive
    await prisma.repository.updateMany({
      where: { installationId: installation.id.toString() },
      data: { isActive: false },
    });
    log.info({ installationId: installation.id }, 'Marked repositories as inactive');
  }
}

/**
 * Handle installation_repositories events
 * Updates repository list when repos are added/removed from installation
 */
async function handleInstallationRepositories(payload: InstallationPayload): Promise<void> {
  const { action, installation, repositories } = payload;

  if (action === 'added' && repositories) {
    for (const repo of repositories) {
      await registerRepository(
        repo.id.toString(),
        repo.full_name.split('/')[0]!,
        repo.full_name.split('/')[1]!,
        repo.full_name,
        installation.id.toString()
      );
    }
  } else if (action === 'removed' && repositories) {
    for (const repo of repositories) {
      await prisma.repository.update({
        where: { githubId: repo.id.toString() },
        data: { isActive: false },
      });
    }
  }
}

/**
 * Register a repository in the database
 */
async function registerRepository(
  githubId: string,
  owner: string,
  name: string,
  fullName: string,
  installationId: string
): Promise<void> {
  await prisma.repository.upsert({
    where: { githubId },
    create: {
      githubId,
      owner,
      name,
      fullName,
      installationId,
      isActive: true,
    },
    update: {
      owner,
      name,
      fullName,
      installationId,
      isActive: true,
    },
  });
  log.info({ githubId, fullName }, 'Registered repository');
}