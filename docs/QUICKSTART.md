# FixFlow Quick Start Guide

Get FixFlow running in 10 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL (or Docker)
- GitHub account
- MNEE account

---

## 1. Clone & Install

```bash
git clone https://github.com/your-org/fixflow.git
cd fixflow

# Install bot dependencies
cd bot && npm install && cd ..

# Install dashboard dependencies
cd dashboard && npm install && cd ..
```

---

## 2. Create GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**

2. Configure:
   - **Name**: `FixFlow`
   - **Webhook URL**: `https://your-server.com/api/webhooks/github`
   - **Webhook Secret**: Generate and save this

3. Permissions:
   - Issues: Read & Write
   - Pull requests: Read & Write
   - Workflows: Read & Write
   - Contents: Read-only

4. Subscribe to events:
   - Issues
   - Issue comment
   - Pull request
   - Workflow run

5. Generate & download private key

6. Note your **App ID**

7. Install the app on your repositories

---

## 3. Get MNEE Credentials

1. Sign up at [mnee.io](https://mnee.io)
2. Get your API Key
3. Get your Wallet WIF
4. Fund your wallet

---

## 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Database
DATABASE_URL=postgresql://fixflow:password@localhost:5432/fixflow

# GitHub
GITHUB_APP_ID=123456
GITHUB_WEBHOOK_SECRET=your_secret
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# MNEE
MNEE_API_KEY=your_key
MNEE_WALLET_WIF=your_wif
MNEE_ENVIRONMENT=sandbox

# API Key (generate with: openssl rand -hex 32)
API_KEY_HASH=sha256_hash_of_your_api_key
```

---

## 5. Setup Database

```bash
cd bot
npx prisma migrate deploy
npx prisma generate
```

---

## 6. Start Services

### Option A: Local

```bash
# Terminal 1 - Bot
cd bot && npm run dev

# Terminal 2 - Dashboard
cd dashboard && npm run dev
```

### Option B: Docker

```bash
docker-compose up -d
```

---

## 7. Add to Repository

Create `.bounty-hunter.yml` in your repo:

```yaml
bounty_config:
  default_amount: 75
  severity_multipliers:
    critical: 4.0
    high: 2.0
    medium: 1.0
    low: 0.5
```

Create `.github/workflows/fixflow.yml`:

```yaml
name: FixFlow

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  bounty:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - uses: fixflow/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.FIXFLOW_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
```

Add secrets to your repo:
- `FIXFLOW_URL`: Your bot server URL
- `FIXFLOW_API_KEY`: Your API key

---

## 8. Test It

1. Create a failing test and push
2. Watch for bounty issue creation
3. Comment `/claim your-wallet-address`
4. Fix the test and merge PR
5. Receive payment! 🎉

---

## Access Points

| Service | URL |
|---------|-----|
| Bot API | http://localhost:3000 |
| Dashboard | http://localhost:3001 |
| Health Check | http://localhost:3000/api/health |

---

## Next Steps

- Read [Full Setup Guide](./SETUP.md)
- Check [API Documentation](./API.md)
- Review [Configuration Options](./CONFIGURATION.md)

---

## Need Help?

- Check [Troubleshooting](./SETUP.md#troubleshooting)
- Open an issue on GitHub