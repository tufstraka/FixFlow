# Bounty Hunter Setup Guide

## Overview

This guide will walk you through setting up the Bounty Hunter system for your GitHub repositories.

## Prerequisites

- Node.js 18+ and npm
- GitHub account with admin access to target repositories
- Ethereum wallet with ETH on Sepolia testnet
- MongoDB instance (local or cloud)

## Step 1: Deploy Smart Contracts

### 1.1 Configure Environment

```bash
cd bounty-hunter/contracts
cp .env.example .env
```

Edit `.env` with your details:
```
SEPOLIA_RPC_URL=https://rpc.sepolia.dev
PRIVATE_KEY=your_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 1.2 Install Dependencies and Deploy

```bash
npm install
npm run deploy
```

Save the deployed contract addresses from the output.

## Step 2: Set Up GitHub App

### 2.1 Create GitHub App

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Configure with these settings:

**Basic Information:**
- Name: `Bounty Hunter Bot`
- Homepage URL: `https://github.com/bounty-hunter/bounty-hunter`
- Webhook URL: `https://your-bot-server.com/webhook`
- Webhook secret: Generate a secure random string

**Permissions:**
- Repository permissions:
  - Actions: Read
  - Issues: Write
  - Pull requests: Read
  - Contents: Read
  - Metadata: Read

**Subscribe to events:**
- Workflow run
- Pull request
- Issues

### 2.2 Generate Private Key

After creating the app:
1. Generate a private key
2. Save it as `github-app-private-key.pem`
3. Note your App ID

## Step 3: Configure Bot Server

### 3.1 Set Up Environment

```bash
cd bounty-hunter/bot
cp .env.example .env
```

Configure `.env`:
```
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/bounty-hunter

# Ethereum
SEPOLIA_RPC_URL=https://rpc.sepolia.dev
PRIVATE_KEY=bot_wallet_private_key
MNEE_TOKEN_ADDRESS=deployed_token_address
BOUNTY_ESCROW_ADDRESS=deployed_escrow_address

# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY_PATH=./github-app-private-key.pem
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Security
JWT_SECRET=generate_secure_secret
API_KEY=generate_secure_api_key
```

### 3.2 Fund Bot Wallet

1. Transfer ETH to bot wallet for gas fees
2. Transfer MNEE tokens to bot wallet for bounties

### 3.3 Install and Start

```bash
npm install
npm start
```

## Step 4: Configure Repository

### 4.1 Install GitHub App

1. Go to your GitHub App settings
2. Click "Install App"
3. Select repositories to install on

### 4.2 Add Bounty Hunter Action

Create `.github/workflows/bounty-hunter.yml`:

```yaml
name: Bounty Hunter

on:
  workflow_run:
    workflows: ["Tests", "CI"]  # Your test workflow names
    types:
      - completed

jobs:
  create-bounty:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Bounty
        uses: bounty-hunter/bounty-hunter-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.BOUNTY_HUNTER_SERVER_URL }}
          bot_api_key: ${{ secrets.BOUNTY_HUNTER_API_KEY }}
          bounty_amount: 50
          max_bounty: 150
```

### 4.3 Add Repository Secrets

In repository settings > Secrets:
- `BOUNTY_HUNTER_SERVER_URL`: Your bot server URL
- `BOUNTY_HUNTER_API_KEY`: The API key from bot `.env`

### 4.4 (Optional) Add Configuration File

Create `.bounty-hunter.yml` in repository root:

```yaml
bounty_config:
  default_amount: 50
  max_bounty: 200
  
  severity_multipliers:
    critical: 4.0
    high: 2.0
    medium: 1.0
    low: 0.5
  
  test_type_amounts:
    unit: 30
    integration: 50
    e2e: 75
    security: 150
  
  escalation:
    enabled: true
    schedule:
      - after_hours: 24
        increase_percent: 20
      - after_hours: 72
        increase_percent: 50
      - after_hours: 168
        increase_percent: 100
```

## Step 5: Test the System

### 5.1 Create a Failing Test

Add a test that will fail:

```javascript
// test/example.test.js
describe('Bounty Test', () => {
  it('should fail to trigger bounty', () => {
    expect(true).toBe(false);
  });
});
```

### 5.2 Push and Verify

1. Push the failing test
2. Wait for CI to fail
3. Check that:
   - GitHub issue is created
   - Bounty is locked on blockchain
   - Bot posts confirmation comment

### 5.3 Fix and Claim

1. Create a PR fixing the test
2. Once merged and tests pass:
   - Bounty is released to PR author
   - Issue is closed

## Troubleshooting

### Bot Not Creating Bounties

1. Check bot server logs
2. Verify GitHub App permissions
3. Ensure bot wallet has funds
4. Check API key in GitHub Action

### Transaction Failures

1. Verify contract addresses in `.env`
2. Check bot wallet ETH balance
3. Ensure MNEE allowance is set
4. Review gas price settings

### Escalation Not Working

1. Check cron job is running
2. Verify time thresholds
3. Review escalation logs
4. Ensure bot has MNEE for increases

## Security Considerations

1. **Private Keys**: Never commit private keys
2. **API Keys**: Rotate regularly
3. **Webhook Secret**: Use strong random values
4. **Bot Wallet**: Only fund with necessary amounts
5. **Contract Access**: Limit authorized bots

## Monitoring

### Bot Health

- Health endpoint: `GET /health`
- Metrics endpoint: `GET /api/admin/metrics`
- Logs: Check `combined.log` and `error.log`

### Blockchain Monitoring

- Etherscan: Track transactions
- Contract events: Monitor bounty activity
- Wallet balance: Set up alerts

## Support

- GitHub Issues: [bounty-hunter/bounty-hunter](https://github.com/bounty-hunter/bounty-hunter/issues)
- Documentation: [docs/](https://github.com/bounty-hunter/bounty-hunter/tree/main/docs)
- Discord: [Join our server](https://discord.gg/bounty-hunter)