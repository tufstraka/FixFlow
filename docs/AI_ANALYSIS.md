# AI-Powered Failure Analysis

FixFlow uses Amazon Bedrock with Claude AI models to provide intelligent analysis of test failures. This document explains how the AI analysis works and how to configure it.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GitHub Repository                                 │
│                                                                              │
│  ┌──────────────────┐    Workflow Fails    ┌────────────────────────────┐  │
│  │  Test Workflow   │ ──────────────────── │  FixFlow GitHub Action     │  │
│  │                  │                       │  (Detects failure & logs)  │  │
│  └──────────────────┘                       └────────────┬───────────────┘  │
│                                                          │                   │
└──────────────────────────────────────────────────────────│───────────────────┘
                                                           │
                                                           │ HTTP POST
                                                           │ (logs, context)
                                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FixFlow Bot Server                                  │
│                                                                              │
│  ┌────────────────────┐    ┌────────────────────┐    ┌──────────────────┐  │
│  │  Webhook Handler   │ ── │  AI Analysis       │ ── │  Amazon Bedrock  │  │
│  │  /webhooks/        │    │  Service           │    │  (Claude 3)      │  │
│  │  create-bounty     │    └────────────────────┘    └──────────────────┘  │
│  └─────────┬──────────┘                                                     │
│            │                                                                 │
│            ▼                                                                 │
│  ┌────────────────────┐    ┌────────────────────┐                          │
│  │  Bounty Service    │ ── │  GitHub App        │                          │
│  │  (Creates bounty)  │    │  (Creates issue)   │                          │
│  └────────────────────┘    └────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Benefits

### 1. Simplified GitHub Action Configuration
- **Before**: AWS credentials needed in every repository's secrets
- **After**: Only bot server URL and API key needed

### 2. Centralized AI Configuration
- Configure AI models once on the server
- Easy to update models without changing repositories
- Consistent analysis across all projects

### 3. Enhanced Security
- AWS credentials stored only on the server
- No exposure of AI credentials in repository secrets
- API key authentication for bot server access

## Configuration

### Server-Side Configuration

Add these environment variables to your bot server's `.env` file:

```bash
# AWS Bedrock AI Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

### Supported Models

| Model ID | Description | Best For |
|----------|-------------|----------|
| `anthropic.claude-3-opus-20240229-v1:0` | Most capable | Complex failures, large codebases |
| `anthropic.claude-3-sonnet-20240229-v1:0` | Balanced (default) | General use, good accuracy |
| `anthropic.claude-3-haiku-20240307-v1:0` | Fastest | High volume, simple failures |

### Repository Configuration

In your GitHub repository, only these secrets are needed:

- `FIXFLOW_SERVER_URL` - URL of the FixFlow bot server
- `FIXFLOW_API_KEY` - API key for authentication

## AI Analysis Features

### 1. Root Cause Analysis

The AI analyzes workflow logs to identify:
- The specific error that caused the failure
- The chain of events leading to the failure
- Files likely involved in the issue

### 2. Error Classification

Errors are classified into types:
- Assertion Error
- Syntax Error
- Dependency Issue
- Timeout
- Network Error
- Configuration Error
- And more...

### 3. Suggested Fixes

The AI provides:
- Specific fix descriptions
- Code examples when applicable
- Confidence levels (high/medium/low)

### 4. Complexity Estimation

Each failure is rated:
- 🟢 **Easy** - Simple fix, usually a typo or minor change
- 🟡 **Medium** - Moderate effort, may require understanding context
- 🔴 **Hard** - Complex fix, may involve architectural changes

## API Reference

### Create Bounty with AI Analysis

**Endpoint:** `POST /webhooks/create-bounty`

**Headers:**
```
Content-Type: application/json
X-API-Key: your_api_key
```

**Request Body:**
```json
{
  "repository": "owner/repo",
  "runId": 123456789,
  "runNumber": 42,
  "jobName": "test",
  "failureUrl": "https://github.com/owner/repo/actions/runs/123456789",
  "commit": "abc123",
  "branch": "main",
  "errorLog": "Test output and error logs...",
  "failedSteps": [
    { "name": "Run tests", "conclusion": "failure" }
  ],
  "bountyAmount": 50,
  "maxAmount": 150
}
```

**Response:**
```json
{
  "success": true,
  "bountyId": 1,
  "issueNumber": 42,
  "issueUrl": "https://github.com/owner/repo/issues/42",
  "amount": 50,
  "maxAmount": 150,
  "aiAnalysis": {
    "rootCause": "Test assertion failed due to unexpected null value",
    "errorType": "Assertion Error",
    "estimatedComplexity": "easy"
  }
}
```

## Fallback Behavior

If AI analysis is unavailable (e.g., AWS credentials not configured), the system:

1. Creates the bounty without AI analysis
2. Uses a fallback analysis object
3. Logs a warning for debugging
4. The issue is still created with basic information

This ensures bounties are always created even if AI is temporarily unavailable.

## AWS Bedrock Setup

### 1. Enable Bedrock Access

1. Go to AWS Console → Amazon Bedrock
2. Navigate to "Model access"
3. Request access to Anthropic Claude models
4. Wait for approval (usually instant)

### 2. Create IAM User

Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
      ]
    }
  ]
}
```

### 3. Generate Access Keys

1. Go to IAM → Users → Your User → Security credentials
2. Create access key for "Application running outside AWS"
3. Save the access key ID and secret

## Troubleshooting

### AI Analysis Returns Fallback

**Symptoms:** Issues created without AI insights

**Check:**
1. AWS credentials are set in environment
2. Bedrock model access is approved
3. Region is correct (model availability varies)
4. Check server logs for errors

### Slow Analysis

**Symptoms:** Bounty creation takes >30 seconds

**Solutions:**
1. Switch to Claude Haiku for faster responses
2. Check AWS region latency
3. Reduce log size sent for analysis

### Invalid JSON in Analysis

**Symptoms:** Parsing errors in logs

**Cause:** AI occasionally returns malformed JSON

**Solution:** The service automatically handles this with JSON extraction and fallback

## Best Practices

1. **Log Quality**: Ensure test frameworks output detailed error messages
2. **Model Selection**: Use Sonnet for balance, Haiku for speed
3. **Monitoring**: Check server logs regularly for AI errors
4. **Cost Management**: Monitor AWS Bedrock usage and costs

## Cost Considerations

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|------------------------|
| Claude 3 Opus | $0.015 | $0.075 |
| Claude 3 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

Typical analysis uses ~2-5K input tokens and ~500-1K output tokens.

## Migration from GitHub Action AI

If you were previously using AI analysis in the GitHub Action:

1. **Remove** AWS secrets from repository settings
2. **Add** AWS credentials to bot server `.env`
3. **Update** workflow to use simplified action inputs
4. **Verify** AI analysis appears in created issues

The behavior is identical - only the configuration location changes.