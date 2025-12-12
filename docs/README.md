# FixFlow

**Automated bounty system for open-source bug fixes**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)](https://www.typescriptlang.org/)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start](docs/QUICKSTART.md) | Get running in 10 minutes |
| [Full Setup Guide](docs/SETUP.md) | Complete setup instructions |
| [API Reference](docs/API.md) | REST API documentation |
| [Configuration](docs/CONFIGURATION.md) | All configuration options |

## Overview

FixFlow automates the creation and management of bounties for failing tests in open-source projects. When your CI/CD pipeline fails, FixFlow automatically creates a bounty, posts a GitHub issue, and pays developers when they fix the problem.

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CI Fails  │────▶│   Bounty    │────▶│  Developer  │────▶│   Payment   │
│             │     │   Created   │     │   Fixes     │     │   Sent      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. **Test Failure Detection**: When a GitHub Actions workflow fails, the FixFlow Action triggers
2. **Bounty Creation**: A bounty is created and a GitHub issue is posted
3. **Claim Process**: Developers claim bounties by commenting `/claim <wallet-address>` on the issue
4. **Payment**: When the fix is merged and tests pass, payment is automatically released via MNEE

## Features

- 🤖 **Automatic Bounty Creation** - Bounties created when tests fail
- 📈 **Bounty Escalation** - Amounts increase over time to attract attention
- 💰 **MNEE Stablecoin Payments** - USD-pegged stable payments
- 🔒 **Secure** - GitHub webhook signature verification, API key authentication
- 📊 **Full Audit Trail** - All bounty state changes are logged
- ⚙️ **Configurable** - Per-repository configuration via `.bounty-hunter.yml`
- 🎨 **Modern Dashboard** - Track bounties, payments, and repositories
- 🌙 **Dark Mode** - Beautiful UI with light/dark theme support

## Quick Start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 15+
- GitHub App credentials
- MNEE API key (get from [developer.mnee.net](https://developer.mnee.net))

### 2. Clone and Install

```bash
git clone https://github.com/your-org/fixflow.git
cd fixflow
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 4. Set Up Database

```bash
npm run db:migrate
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### 6. Deploy with Docker

```bash
docker-compose up -d
```

## Repository Configuration

Create a `.bounty-hunter.yml` file in your repository root:

```yaml
bounty_config:
  # Base bounty amount in MNEE
  default_amount: 50
  
  # Severity multipliers
  severity_multipliers:
    critical: 4.0
    high: 2.0
    medium: 1.0
    low: 0.5
  
  # Test name patterns for severity detection
  severity_patterns:
    critical:
      - security
      - auth
    high:
      - api
      - database
    low:
      - style
      - lint
  
  # Bounty escalation schedule
  escalation:
    - after_hours: 24
      increase_percent: 20
    - after_hours: 72
      increase_percent: 50
    - after_hours: 168
      increase_percent: 100
  
  # Maximum bounty multiplier
  max_multiplier: 3.0
  
  # Auto-expire after (hours)
  expire_after_hours: 336
```

## GitHub Action Setup

Add the FixFlow Action to your repository:

```yaml
# .github/workflows/bounty-hunter.yml
name: FixFlow

on:
  workflow_run:
    workflows: ["Tests", "CI"]
    types: [completed]

jobs:
  create-bounty:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    
    steps:
      - uses: fixflow/fixflow-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.FIXFLOW_SERVER_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
          bounty_amount: 50
```

## API Endpoints

### Health Check

```
GET /api/health
```

### Bounties

```
POST /api/bounties          # Create bounty (requires API key)
GET  /api/bounties          # List bounties
GET  /api/bounties/:id      # Get bounty by ID
POST /api/bounties/:id/activate   # Activate bounty
POST /api/bounties/:id/claim      # Claim bounty
POST /api/bounties/:id/complete   # Complete bounty
```

### Webhooks

```
POST /api/webhooks/github   # GitHub webhook endpoint
POST /api/payments/webhook  # MNEE payment webhook
```

## Architecture

```
fixflow/
├── bot/                    # Bot server (Express/TypeScript)
│   ├── src/
│   │   ├── api/           # REST API routes & middleware
│   │   ├── services/      # Business logic
│   │   ├── db/            # Database client
│   │   └── config/        # Configuration
│   └── prisma/            # Database schema
├── dashboard/              # Web dashboard (Next.js)
│   └── src/
│       ├── app/           # Pages (App Router)
│       ├── components/    # UI components
│       └── lib/           # Utilities
├── action/                 # GitHub Action
│   └── src/
├── shared/                 # Shared types and utilities
│   └── src/
├── docs/                   # Documentation
└── docker-compose.yml
```

### Bounty Lifecycle

```
PENDING → ACTIVE → CLAIMED → COMPLETED
              ↓        ↓
          ESCALATED → EXPIRED
```

| Status | Description |
|--------|-------------|
| PENDING | Created, awaiting funding verification |
| ACTIVE | Live, accepting claims |
| CLAIMED | Developer submitted PR |
| ESCALATED | Amount increased due to time |
| COMPLETED | Fix verified, payment sent |
| EXPIRED | Time limit exceeded |

## Development

### Prerequisites

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Linting

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Dashboard

FixFlow includes a modern web dashboard for monitoring and managing bounties.

### Features

- 📊 **Dashboard Overview** - Stats, charts, and recent activity
- 🐛 **Bounties Management** - Search, filter, and track bounties
- 📁 **Repository Settings** - Configure per-repo bounty settings
- 💳 **Payment History** - View all payment transactions
- ⚙️ **Settings** - API configuration and preferences
- 🌙 **Dark/Light Mode** - Toggle between themes

### Running the Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3001
```

## Deployment

### Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f bot
docker-compose logs -f dashboard

# Stop
docker-compose down
```

### Services

| Service | Port | URL |
|---------|------|-----|
| Bot Server | 3000 | http://localhost:3000 |
| Dashboard | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GITHUB_APP_ID` | GitHub App ID | Yes |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key | Yes |
| `GITHUB_WEBHOOK_SECRET` | Webhook signature secret | Yes |
| `MNEE_API_KEY` | MNEE API key | Yes |
| `MNEE_ENVIRONMENT` | `sandbox` or `production` | Yes |
| `MNEE_WALLET_WIF` | Wallet private key (WIF) | Yes |
| `API_KEY_HASH` | SHA256 hash of API key | Yes |

## Creating a GitHub App

1. Go to GitHub Settings → Developer settings → GitHub Apps
2. Create a new GitHub App with:
   - **Webhook URL**: `https://your-server.com/api/webhooks/github`
   - **Webhook secret**: Generate a secure secret
   - **Permissions**:
     - Issues: Read & Write
     - Pull requests: Read
     - Actions: Read
     - Contents: Read
   - **Subscribe to events**:
     - Workflow run
     - Pull request
     - Issue comment
     - Installation

3. Generate and download a private key
4. Note the App ID

## Screenshots

### Dashboard Home
![Dashboard](docs/images/dashboard.png)

### Bounties List
![Bounties](docs/images/bounties.png)

### Dark Mode
![Dark Mode](docs/images/dark-mode.png)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](docs/SETUP.md)
- 🐛 [Issue Tracker](https://github.com/fixflow/fixflow/issues)

## Acknowledgments

- [MNEE](https://mnee.io) - Stablecoin payment processing
- [Prisma](https://prisma.io) - Database ORM
- [Next.js](https://nextjs.org) - Dashboard framework
- [Tailwind CSS](https://tailwindcss.com) - UI styling
- [Radix UI](https://radix-ui.com) - UI components