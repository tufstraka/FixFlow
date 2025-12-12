import * as core from '@actions/core';
import * as github from '@actions/github';
import { getConfig, BountyConfig } from './config.js';
import { createBounty, BountyResponse } from './api.js';

interface WorkflowRunEvent {
  action: string;
  workflow_run: {
    id: number;
    name: string;
    head_branch: string;
    head_sha: string;
    status: string;
    conclusion: string | null;
    html_url: string;
    pull_requests: Array<{
      number: number;
    }>;
  };
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
}

async function run(): Promise<void> {
  try {
    // Get inputs
    const botServerUrl = core.getInput('bot_server_url', { required: true });
    const botApiKey = core.getInput('bot_api_key', { required: true });
    const defaultBountyAmount = parseFloat(core.getInput('bounty_amount') || '50');
    const githubToken = core.getInput('github_token', { required: true });

    // Get GitHub context
    const context = github.context;
    
    // Only handle workflow_run events
    if (context.eventName !== 'workflow_run') {
      core.info(`Skipping: Event type is ${context.eventName}, not workflow_run`);
      return;
    }

    const payload = context.payload as WorkflowRunEvent;

    // Only handle completed workflows
    if (payload.action !== 'completed') {
      core.info(`Skipping: Workflow action is ${payload.action}, not completed`);
      return;
    }

    // Only create bounty for failed workflows
    if (payload.workflow_run.conclusion !== 'failure') {
      core.info(`Skipping: Workflow conclusion is ${payload.workflow_run.conclusion}, not failure`);
      return;
    }

    core.info(`Workflow "${payload.workflow_run.name}" failed on branch ${payload.workflow_run.head_branch}`);

    // Get repository config
    const octokit = github.getOctokit(githubToken);
    let config: BountyConfig | null = null;

    try {
      config = await getConfig(
        octokit,
        payload.repository.owner.login,
        payload.repository.name
      );
      core.info('Loaded repository bounty configuration');
    } catch (error) {
      core.info('No .bounty-hunter.yml found, using defaults');
    }

    // Determine bounty amount
    const bountyAmount = config?.bountyConfig?.defaultAmount ?? defaultBountyAmount;

    // Create bounty via bot server API
    core.info(`Creating bounty for ${bountyAmount} MNEE...`);

    const bounty: BountyResponse = await createBounty(botServerUrl, botApiKey, {
      repositoryOwner: payload.repository.owner.login,
      repositoryName: payload.repository.name,
      workflowRunId: payload.workflow_run.id.toString(),
      workflowName: payload.workflow_run.name,
      failureDetails: `Workflow "${payload.workflow_run.name}" failed on branch ${payload.workflow_run.head_branch}. See: ${payload.workflow_run.html_url}`,
      amount: bountyAmount,
    });

    // Set outputs
    core.setOutput('bounty_id', bounty.id);
    core.setOutput('bounty_amount', bounty.currentAmount);
    core.setOutput('issue_url', bounty.githubIssueId ? `https://github.com/${payload.repository.owner.login}/${payload.repository.name}/issues/${bounty.githubIssueNumber}` : '');

    // Create summary
    core.summary
      .addHeading('🏆 FixFlow Bounty Created')
      .addTable([
        [{ data: 'Property', header: true }, { data: 'Value', header: true }],
        ['Bounty ID', bounty.id],
        ['Amount', `${bounty.currentAmount} ${bounty.currency}`],
        ['Workflow', payload.workflow_run.name],
        ['Branch', payload.workflow_run.head_branch],
        ['Status', bounty.status],
      ])
      .addLink('View Workflow Run', payload.workflow_run.html_url);

    if (bounty.githubIssueNumber) {
      core.summary.addLink(
        'View Bounty Issue',
        `https://github.com/${payload.repository.owner.login}/${payload.repository.name}/issues/${bounty.githubIssueNumber}`
      );
    }

    await core.summary.write();

    core.info(`✅ Bounty created successfully! ID: ${bounty.id}, Amount: ${bounty.currentAmount} MNEE`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed('Action failed with an unknown error');
    }
  }
}

run();