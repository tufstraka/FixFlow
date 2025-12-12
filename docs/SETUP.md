# FixFlow Complete Setup Guide

This guide will walk you through setting up FixFlow from scratch, including the GitHub App, MNEE payment integration, bot server, and dashboard.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [GitHub App Setup](#github-app-setup)
4. [MNEE Account Setup](#mnee-account-setup)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Bot Server Deployment](#bot-server-deployment)
8. [Dashboard Deployment](#dashboard-deployment)
9. [Repository Integration](#repository-integration)
10. [Testing Your Setup](#testing-your-setup)
11. [Production Deployment](#production-deployment)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/)
- **Docker & Docker Compose** (optional, for containerized deployment) - [Download](https://www.docker.com/)
- **A GitHub account** with permission to create GitHub Apps
- **An MNEE account** for payment processing - [Sign up](https://mnee.io)
- **A domain or ngrok** for webhook endpoints (GitHub needs to reach your server)

---

## Project Structure

```
fixflow/
├── bot/                    # Bot server (Express + TypeScript)
│   ├── src/
│   │   ├── api/           # API routes and middleware
│   │   ├── services/      # Business logic
│   │   └── index.ts       # Entry point
│   ├── prisma/            # Database schema
│   └── Dockerfile
├── dashboard/             # Web dashboard (Next.js)
│   ├── src/
│   │   ├── app/          # Pages
│   │   ├── components/   # UI components
│   │   └── lib/          # Utilities
│   └── Dockerfile
├── action/                # GitHub Action
│   └── src/
├── shared/                # Shared types
├── docker-compose.yml
└── .env.example
```

---

## GitHub App Setup

### Step 1: Create a New GitHub App

1. Go to **GitHub Settings** → **Developer settings** → **GitHub Apps**
2. Click **"New GitHub App"**

### Step 2: Configure Basic Information

| Field | Value |
|-------|-------|
| **GitHub App name** | `FixFlow` (or your preferred name) |
| **Homepage URL** | Your website or `https://github.com/your-org/fixflow` |
| **Webhook URL** | `https://your-domain.com/api/webhooks/github` |
| **Webhook secret** | Generate a secure random string (save this!) |

### Step 3: Set Permissions

Navigate to the **Permissions** section and configure:

#### Repository Permissions
| Permission | Access |
|------------|--------|
| **Actions** | Read-only |
| **Checks** | Read and write |
| **Contents** | Read-only |
| **Issues** | Read and write |
| **Metadata** | Read-only |
| **Pull requests** | Read and write |
| **Workflows** | Read and write |

#### Organization Permissions
| Permission | Access |
|------------|--------|
| **Members** | Read-only (optional) |

### Step 4: Subscribe to Events

Check the following events:
- ✅ **Issues**
- ✅ **Issue comment**
- ✅ **Pull request**
- ✅ **Workflow run**
- ✅ **Installation** (if available)

### Step 5: Generate Private Key

1. After creating the app, scroll to **Private keys**
2. Click **"Generate a private key"**
3. A `.pem` file will download - **keep this secure!**

### Step 6: Note Your App ID

On your GitHub App's page, note the **App ID** (a number like `123456`).

### Step 7: Install the App

1. Go to the **Install App** tab
2. Click **Install** next to your account/organization
3. Select the repositories you want to enable FixFlow on
4. Note the **Installation ID** from the URL after installing (e.g., `/installations/12345678`)

---

## MNEE Account Setup

### Step 1: Create MNEE Account

1. Go to [mnee.io](https://mnee.io) and sign up
2. Complete KYC verification if required

### Step 2: Get API Credentials

1. Navigate to **Settings** → **API Keys**
2. Create a new API key
3. Note down:
   - **API Key** - For authentication
   - **Wallet WIF** - Your wallet's private key for sending payments
   - **Webhook Secret** - For verifying payment webhooks

### Step 3: Fund Your Wallet

1. Get your wallet address from MNEE dashboard
2. Transfer MNEE tokens to your wallet
3. This wallet will fund all bounty payouts

### Step 4: Configure Webhook (Optional)

Set up a webhook to receive payment status updates:
- **URL**: `https://your-domain.com/api/webhooks/mnee`
- **Events**: Transaction status updates

---

## Environment Configuration

### Step 1: Copy Environment Template

```bash
cp .env.example .env
```

### Step 2: Configure Environment Variables

Edit `.env` with your values:

```bash
# ===================
# Server Configuration
# ===================
NODE_ENV=development
PORT=3000

# ===================
# Database
# ===================
DATABASE_URL=postgresql://fixflow:your_password@localhost:5432/fixflow

# PostgreSQL (for Docker)
POSTGRES_USER=fixflow
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=fixflow

# ===================
# GitHub App
# ===================
# Found on your GitHub App settings page
GITHUB_APP_ID=123456

# The webhook secret you created
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# Private key - paste the entire contents of the .pem file
# Replace newlines with \n
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----"

# ===================
# MNEE Payment
# ===================
MNEE_API_KEY=your_mnee_api_key
MNEE_WALLET_WIF=your_wallet_private_key
MNEE_WEBHOOK_SECRET=your_mnee_webhook_secret
MNEE_ENVIRONMENT=sandbox  # Use 'production' for live

# ===================
# API Security
# ===================
# Generate with: openssl rand -hex 32
API_KEY_HASH=your_api_key_hash

# ===================
# Dashboard (Optional)
# ===================
NEXT_PUBLIC_API_URL=http://localhost:3000
DASHBOARD_PORT=3001
```

### Step 3: Generate API Key

Generate an API key for the GitHub Action to communicate with your bot:

```bash
# Generate a random API key
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...

# Hash the API key for storage
echo -n "your_api_key" | sha256sum
# Store the hash in API_KEY_HASH
```

**Important**: Save the original API key - you'll need it for the GitHub Action secrets.

---

## Database Setup

### Option A: Local PostgreSQL

```bash
# Create database
createdb fixflow

# Or using psql
psql -U postgres -c "CREATE DATABASE fixflow;"
psql -U postgres -c "CREATE USER fixflow WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE fixflow TO fixflow;"
```

### Option B: Using Docker

```bash
# Start only the database
docker-compose up -d db

# Wait for it to be healthy
docker-compose ps
```

### Run Migrations

```bash
cd bot
npm install
npx prisma migrate deploy
npx prisma generate
```

---

## Bot Server Deployment

### Option A: Local Development

```bash
# Install dependencies
cd bot
npm install

# Generate Prisma client
npx prisma generate

# Run in development mode
npm run dev
```

The server will start at `http://localhost:3000`.

### Option B: Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot
```

### Verify the Server

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-..."}
```

---

## Dashboard Deployment

### Option A: Local Development

```bash
cd dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:3001`.

### Option B: Docker Deployment

The dashboard is included in docker-compose:

```bash
docker-compose up -d dashboard
```

### Option C: Vercel Deployment

1. Push your dashboard to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = Your bot server URL

---

## Repository Integration

### Step 1: Create Repository Configuration

In each repository you want to enable, create `.bounty-hunter.yml`:

```yaml
# .bounty-hunter.yml
bounty_config:
  # Default bounty amount in MNEE
  default_amount: 75
  
  # Severity multipliers
  severity_multipliers:
    critical: 4.0    # 75 × 4.0 = 300 MNEE
    high: 2.0        # 75 × 2.0 = 150 MNEE
    medium: 1.0      # 75 × 1.0 = 75 MNEE
    low: 0.5         # 75 × 0.5 = 37.5 MNEE

  # Escalation settings (optional)
  escalation:
    enabled: true
    max_multiplier: 3.0  # Cap at 3x original amount
    
  # Auto-approve bounties under this amount
  auto_approve_threshold: 100
```

### Step 2: Add GitHub Action Workflow

Create `.github/workflows/fixflow.yml`:

```yaml
name: FixFlow Bounty

on:
  workflow_run:
    workflows: ["CI", "Tests", "Build"]  # Your test workflow names
    types: [completed]

jobs:
  create-bounty:
    runs-on: ubuntu-latest
    # Only run when tests fail
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    
    steps:
      - name: Create Bounty
        uses: your-org/fixflow-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.FIXFLOW_BOT_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
          bounty_amount: 75  # Default, can be overridden by config
```

### Step 3: Add Repository Secrets

In your repository settings, add these secrets:

| Secret Name | Value |
|-------------|-------|
| `FIXFLOW_BOT_URL` | `https://your-fixflow-server.com` |
| `FIXFLOW_API_KEY` | The API key you generated earlier |

---

## Testing Your Setup

### 1. Test Webhook Connectivity

Use [ngrok](https://ngrok.com) for local testing:

```bash
ngrok http 3000
# Note the https URL (e.g., https://abc123.ngrok.io)
```

Update your GitHub App's webhook URL to the ngrok URL.

### 2. Trigger a Test Workflow

1. Create a failing test in your repository
2. Push the change
3. Watch for:
   - Webhook received in bot logs
   - Issue created in repository
   - Bounty visible in dashboard

### 3. Test Bounty Claim

1. Comment on the bounty issue: `/claim 1YourWalletAddress`
2. Check that the bounty status changes to "CLAIMED"

### 4. Test Payment Flow

1. Create a PR that fixes the failing test
2. Merge the PR
3. Verify:
   - Bounty status changes to "COMPLETED"
   - Payment is sent via MNEE
   - Payment appears in dashboard

---

## Production Deployment

### Using Docker Compose

```bash
# Pull latest images
docker-compose pull

# Deploy with production settings
NODE_ENV=production docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Using Kubernetes

See [kubernetes/](../kubernetes/) directory for Helm charts and manifests.

### Environment Recommendations

| Service | Minimum | Recommended |
|---------|---------|-------------|
| Bot Server | 512MB RAM, 1 vCPU | 1GB RAM, 2 vCPU |
| Dashboard | 256MB RAM, 0.5 vCPU | 512MB RAM, 1 vCPU |
| PostgreSQL | 512MB RAM, 1 vCPU | 2GB RAM, 2 vCPU |

### SSL/TLS Setup

For production, use a reverse proxy (nginx, Caddy, or cloud load balancer) with SSL:

```nginx
server {
    listen 443 ssl;
    server_name fixflow.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Troubleshooting

### Webhook Not Received

1. **Check ngrok/tunnel is running** for local dev
2. **Verify webhook URL** in GitHub App settings
3. **Check webhook secret** matches your `.env`
4. **View webhook deliveries** in GitHub App settings → Advanced → Recent Deliveries

### Database Connection Failed

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Docker network
docker network inspect fixflow-network

# Verify credentials
docker-compose exec db psql -U fixflow -c "SELECT 1"
```

### GitHub App Authentication Failed

1. Verify `GITHUB_APP_ID` is correct
2. Check private key format (newlines as `\n`)
3. Ensure the app is installed on the repository

### MNEE Payment Failed

1. Check wallet balance: `curl https://api.mnee.io/v1/balance`
2. Verify API key is valid
3. Check recipient wallet address format
4. Review MNEE dashboard for transaction status

### Bounty Not Created

1. Check bot server logs: `docker-compose logs bot`
2. Verify webhook is received
3. Ensure repository is configured (`.bounty-hunter.yml`)
4. Check database for any errors

### Dashboard Not Loading

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS settings on bot server
3. Ensure bot server is accessible from dashboard

---

## Getting Help

- **GitHub Issues**: [github.com/your-org/fixflow/issues](https://github.com/your-org/fixflow/issues)
- **Documentation**: [docs/](../docs/)
- **API Reference**: [docs/API.md](./API.md)

---

## Next Steps

1. ✅ Set up GitHub App
2. ✅ Configure MNEE account
3. ✅ Deploy bot server
4. ✅ Deploy dashboard
5. ✅ Integrate first repository
6. 🎉 Start automating bounties!

For advanced configuration options, see:
- [Configuration Reference](./CONFIGURATION.md)
- [API Documentation](./API.md)
- [Security Best Practices](./SECURITY.md)