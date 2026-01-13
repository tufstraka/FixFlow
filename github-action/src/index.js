const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * FixFlow GitHub Action
 * 
 * This action detects test failures and creates bounties via the FixFlow bot server.
 * AI-powered analysis is handled by the bot server, not this action.
 * 
 * Flow:
 * 1. Detect workflow failure
 * 2. Fetch workflow logs
 * 3. Send data to bot server
 * 4. Bot performs AI analysis and creates issue with bounty
 */

/**
 * Fetches workflow logs for analysis
 * @param {Object} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} runId - Workflow run ID
 * @param {number} jobId - Job ID
 * @returns {string} Combined logs from the workflow
 */
async function fetchWorkflowLogs(octokit, owner, repo, runId, jobId) {
  try {
    // Try to get job-specific logs first
    if (jobId) {
      try {
        const { data: logData } = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
          owner,
          repo,
          job_id: jobId
        });
        return typeof logData === 'string' ? logData : 'Logs in binary format';
      } catch (jobLogError) {
        core.warning(`Could not fetch job-specific logs: ${jobLogError.message}`);
      }
    }

    // Fallback to workflow run logs
    const { data: logsData } = await octokit.rest.actions.downloadWorkflowRunLogs({
      owner,
      repo,
      run_id: runId
    });
    
    return typeof logsData === 'string' ? logsData : 'Logs in binary format';
  } catch (error) {
    core.warning(`Could not fetch workflow logs: ${error.message}`);
    return 'Logs unavailable';
  }
}

async function run() {
  try {
    // Get inputs
    const githubToken = core.getInput('github_token', { required: true });
    const botServerUrl = core.getInput('bot_server_url', { required: true });
    const configFile = core.getInput('config_file');
    const defaultBountyAmount = parseInt(core.getInput('bounty_amount'));
    const maxBounty = parseInt(core.getInput('max_bounty'));
    const onFailureOnly = core.getInput('on_failure_only') === 'true';

    // Get context
    const { context } = github;
    const octokit = github.getOctokit(githubToken);

    // Check if this is a failed workflow (for workflow_run trigger)
    const workflowRunConclusion = context.payload.workflow_run?.conclusion;
    if (onFailureOnly && workflowRunConclusion !== 'failure') {
      core.info(`Workflow did not fail (conclusion: ${workflowRunConclusion || 'not a workflow_run event'}), skipping bounty creation`);
      core.setOutput('bounty_created', 'false');
      return;
    }

    core.info(`Workflow run failed! Creating bounty...`);

    // Load configuration
    let config = {
      default_amount: defaultBountyAmount,
      max_bounty: maxBounty,
      severity_multipliers: {
        critical: 4.0,
        high: 2.0,
        medium: 1.0,
        low: 0.5
      }
    };

    if (fs.existsSync(configFile)) {
      try {
        const configContent = fs.readFileSync(configFile, 'utf8');
        const loadedConfig = yaml.load(configContent);
        config = { ...config, ...loadedConfig.bounty_config };
        core.info(`Loaded configuration from ${configFile}`);
      } catch (error) {
        core.warning(`Failed to load config file: ${error.message}`);
      }
    }

    // Get workflow run details
    const workflowRun = context.payload.workflow_run || {};
    const runId = workflowRun.id || context.runId;
    const runNumber = workflowRun.run_number || context.runNumber;

    // Get job information
    const { data: jobs } = await octokit.rest.actions.listJobsForWorkflowRun({
      owner: context.repo.owner,
      repo: context.repo.repo,
      run_id: runId
    });

    // Find failed job
    const failedJob = jobs.jobs.find(job => job.conclusion === 'failure');
    if (!failedJob && onFailureOnly) {
      core.info('No failed jobs found');
      core.setOutput('bounty_created', 'false');
      return;
    }

    // Extract error information
    let errorSummary = 'Test failure detected';
    let failedSteps = [];

    if (failedJob) {
      errorSummary = `Failed job: ${failedJob.name}`;
      failedSteps = failedJob.steps
        .filter(step => step.conclusion === 'failure')
        .map(step => ({ name: step.name, conclusion: step.conclusion }));
    }

    // Fetch workflow logs - bot will use these for AI analysis
    core.info('Fetching workflow logs...');
    const logs = await fetchWorkflowLogs(
      octokit,
      context.repo.owner,
      context.repo.repo,
      runId,
      failedJob?.id
    );
    core.info(`Fetched ${logs.length} characters of logs`);

    // Determine bounty amount based on configuration
    let bountyAmount = config.default_amount;

    // Check for severity labels (would be added by maintainers)
    const labels = [];
    if (context.payload.issue?.labels) {
      labels.push(...context.payload.issue.labels.map(l => l.name));
    }

    // Apply severity multipliers
    for (const label of labels) {
      if (label.startsWith('bounty:')) {
        const severity = label.replace('bounty:', '');
        if (config.severity_multipliers[severity]) {
          bountyAmount = Math.floor(config.default_amount * config.severity_multipliers[severity]);
          break;
        }
      }
    }

    // Call bot API to create bounty with AI analysis
    // The bot server handles all AI-powered analysis
    // Authentication is via the GitHub token (proves access to the repository)
    core.info('Sending data to FixFlow bot server for AI analysis and bounty creation...');
    
    try {
      const response = await fetch(`${botServerUrl}/webhooks/create-bounty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Token': githubToken
        },
        body: JSON.stringify({
          repository: `${context.repo.owner}/${context.repo.repo}`,
          runId: runId,
          runNumber: runNumber,
          jobName: failedJob?.name || 'Unknown',
          failureUrl: workflowRun.html_url || `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${runId}`,
          commit: context.sha,
          branch: context.ref.replace('refs/heads/', ''),
          errorLog: logs,
          failedSteps: failedSteps,
          bountyAmount: bountyAmount,
          maxAmount: config.max_bounty || bountyAmount * 3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bot API returned ${response.status}: ${errorText}`);
      }

      const bountyData = await response.json();
      
      core.info(`✓ Bounty created successfully!`);
      core.info(`  Bounty ID: ${bountyData.bountyId}`);
      core.info(`  Issue: ${bountyData.issueUrl}`);
      core.info(`  Amount: ${bountyData.amount} MNEE`);
      
      if (bountyData.aiAnalysis) {
        core.info(`  AI Analysis: ${bountyData.aiAnalysis.errorType || 'Unknown'} - ${bountyData.aiAnalysis.estimatedComplexity || 'Unknown'} complexity`);
      }

      // Set outputs
      core.setOutput('bounty_created', 'true');
      core.setOutput('bounty_id', bountyData.bountyId.toString());
      core.setOutput('issue_number', bountyData.issueNumber.toString());
      core.setOutput('issue_url', bountyData.issueUrl);
      core.setOutput('ai_error_type', bountyData.aiAnalysis?.errorType || 'Unknown');
      core.setOutput('ai_complexity', bountyData.aiAnalysis?.estimatedComplexity || 'Unknown');

    } catch (error) {
      core.error(`Failed to create bounty: ${error.message}`);
      
      // Set failure outputs
      core.setOutput('bounty_created', 'false');
      core.setOutput('error', error.message);
      
      // Don't fail the action - this allows the workflow to continue
      core.warning('Bounty creation failed. The issue can be manually created later.');
    }

  } catch (error) {
    core.setFailed(error.message);
  }
}

// Run the action
run();