# FixFlow Architecture

## System Overview

FixFlow is an automated bounty system for open-source bug fixes. It consists of four main components:

1. **Bot Server** - Central orchestration service handling webhooks, bounty lifecycle, and payments
2. **GitHub Action** - Runs in CI/CD pipelines to detect test failures and trigger bounty creation
3. **GitHub App** - Provides secure OAuth-based integration with GitHub repositories
4. **MNEE Payment System** - Handles stablecoin payments to bounty claimers

## High-Level Architecture

```mermaid
flowchart TB
    subgraph GitHub
        GHA[GitHub Action]
        GHApp[GitHub App]
        Repo[Repository]
        PR[Pull Requests]
        Issues[Issues]
    end
    
    subgraph FixFlow Server
        API[REST API]
        Webhooks[Webhook Handler]
        Scheduler[Escalation Scheduler]
        BountyService[Bounty Service]
        PaymentService[Payment Service]
    end
    
    subgraph Database
        PG[(PostgreSQL)]
    end
    
    subgraph Payment
        MNEE[MNEE SDK]
        Wallet[Bounty Wallet]
    end
    
    Repo -->|CI fails| GHA
    GHA -->|Create bounty| API
    GHApp -->|Webhooks| Webhooks
    PR -->|PR merged| Webhooks
    Webhooks --> BountyService
    BountyService --> PG
    BountyService --> Issues
    Scheduler -->|Escalate amounts| BountyService
    BountyService -->|Pay claimant| PaymentService
    PaymentService --> MNEE
    MNEE --> Wallet
```

## Bounty Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Test fails
    Pending --> Active: Bounty funded
    Active --> Claimed: PR submitted
    Claimed --> Active: PR closed without merge
    Claimed --> Completed: Tests pass and PR merged
    Active --> Escalated: Time threshold reached
    Escalated --> Claimed: PR submitted
    Escalated --> Expired: Max time exceeded
    Active --> Expired: Max time exceeded
    Completed --> [*]: Payment sent
    Expired --> [*]: Funds returned
```

### Bounty States

| State | Description |
|-------|-------------|
| **Pending** | Bounty created, awaiting funding verification |
| **Active** | Bounty is live and accepting claims |
| **Claimed** | A developer has submitted a PR claiming this bounty |
| **Escalated** | Bounty amount has increased due to time elapsed |
| **Completed** | Fix verified, payment processing |
| **Expired** | Bounty exceeded maximum time without resolution |

## Detailed Component Design

### 1. Bot Server

The bot server is the central orchestration layer built with Node.js/TypeScript and Express.

#### Directory Structure

```
bot/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   └── index.ts             # Environment configuration
│   ├── api/
│   │   ├── routes/
│   │   │   ├── bounties.ts      # Bounty CRUD endpoints
│   │   │   ├── webhooks.ts      # GitHub webhook handlers
│   │   │   └── payments.ts      # Payment status endpoints
│   │   └── middleware/
│   │       ├── auth.ts          # API key authentication
│   │       ├── webhookVerify.ts # GitHub signature verification
│   │       └── rateLimit.ts     # Rate limiting
│   ├── services/
│   │   ├── bounty/
│   │   │   ├── BountyService.ts
│   │   │   ├── BountyStateMachine.ts
│   │   │   └── EscalationScheduler.ts
│   │   ├── github/
│   │   │   ├── GitHubAppAuth.ts
│   │   │   ├── IssueManager.ts
│   │   │   └── PRVerifier.ts
│   │   └── payment/
│   │       ├── MNEEService.ts
│   │       └── WalletManager.ts
│   ├── models/
│   │   ├── Bounty.ts
│   │   ├── Repository.ts
│   │   ├── Payment.ts
│   │   └── AuditLog.ts
│   ├── db/
│   │   ├── connection.ts
│   │   └── migrations/
│   └── utils/
│       ├── logger.ts
│       └── crypto.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/github` | Receive GitHub webhooks |
| POST | `/api/bounties` | Create new bounty from Action |
| GET | `/api/bounties/:id` | Get bounty details |
| GET | `/api/bounties` | List bounties with filters |
| PATCH | `/api/bounties/:id/claim` | Claim a bounty |
| POST | `/api/payments/webhook` | MNEE payment callbacks |
| GET | `/api/health` | Health check endpoint |

### 2. GitHub Action

The GitHub Action runs in repositories to detect test failures and communicate with the bot server.

#### Directory Structure

```
action/
├── src/
│   ├── index.ts           # Action entry point
│   ├── github.ts          # GitHub API interactions
│   ├── api.ts             # Bot server communication
│   └── config.ts          # Parse repository config
├── action.yml             # Action definition
├── package.json
└── tsconfig.json
```

#### Action Workflow

```mermaid
sequenceDiagram
    participant CI as CI Pipeline
    participant Action as FixFlow Action
    participant Bot as Bot Server
    participant GH as GitHub API
    
    CI->>CI: Tests fail
    CI->>Action: Trigger on workflow_run failure
    Action->>Action: Parse failure details
    Action->>Action: Read .bounty-hunter.yml config
    Action->>Bot: POST /api/bounties
    Bot->>Bot: Create bounty record
    Bot->>GH: Create issue with bounty details
    Bot->>Action: Return bounty ID
    Action->>CI: Complete with summary
```

### 3. Database Schema

```mermaid
erDiagram
    repositories {
        uuid id PK
        string github_id
        string owner
        string name
        string installation_id
        jsonb config
        timestamp created_at
        timestamp updated_at
    }
    
    bounties {
        uuid id PK
        uuid repository_id FK
        string github_issue_id
        string workflow_run_id
        string status
        decimal initial_amount
        decimal current_amount
        string currency
        string test_name
        text failure_details
        string claimed_by_pr
        string claimed_by_user
        timestamp created_at
        timestamp escalated_at
        timestamp claimed_at
        timestamp completed_at
    }
    
    payments {
        uuid id PK
        uuid bounty_id FK
        string recipient_address
        decimal amount
        string mnee_ticket_id
        string mnee_tx_id
        string status
        timestamp created_at
        timestamp completed_at
    }
    
    audit_logs {
        uuid id PK
        uuid bounty_id FK
        string event_type
        jsonb event_data
        string actor
        timestamp created_at
    }
    
    repositories ||--o{ bounties : has
    bounties ||--o| payments : has
    bounties ||--o{ audit_logs : has
```

### 4. Payment Flow

```mermaid
sequenceDiagram
    participant PR as Pull Request
    participant Bot as Bot Server
    participant GH as GitHub
    participant MNEE as MNEE SDK
    participant DB as Database
    
    PR->>GH: Merge PR
    GH->>Bot: Webhook - PR merged
    Bot->>Bot: Verify PR fixes failing tests
    Bot->>GH: Re-run workflow
    GH->>Bot: Webhook - Tests pass
    Bot->>DB: Update bounty status to COMPLETED
    Bot->>Bot: Get claimant wallet address
    Bot->>MNEE: transfer with recipients and amount
    MNEE->>Bot: Return ticketId
    Bot->>DB: Store payment record
    MNEE->>Bot: Webhook - Payment confirmed
    Bot->>DB: Update payment with tx_id
    Bot->>GH: Comment on issue with payment confirmation
    Bot->>GH: Close bounty issue
```

### 5. Escalation System

Bounties automatically increase in value over time to incentivize fixes.

```mermaid
flowchart LR
    subgraph Time Elapsed
        T0[0 hours]
        T24[24 hours]
        T72[72 hours]
        T168[168 hours / 1 week]
    end
    
    subgraph Bounty Value
        V0[Base: 50 MNEE]
        V24[+20%: 60 MNEE]
        V72[+50%: 75 MNEE]
        V168[+100%: 100 MNEE]
    end
    
    T0 --> V0
    T24 --> V24
    T72 --> V72
    T168 --> V168
```

The escalation scheduler runs as a cron job checking for bounties that have crossed time thresholds.

## Configuration

### Repository Configuration - .bounty-hunter.yml

```yaml
bounty_config:
  # Base amount for new bounties
  default_amount: 50
  
  # Currency - always MNEE
  currency: MNEE
  
  # Severity multipliers based on test labels or patterns
  severity_multipliers:
    critical: 4.0
    high: 2.0
    medium: 1.0
    low: 0.5
  
  # Test name patterns for severity detection
  severity_patterns:
    critical:
      - "security"
      - "auth"
    high:
      - "api"
      - "database"
    low:
      - "style"
      - "lint"
  
  # Escalation schedule
  escalation:
    - after_hours: 24
      increase_percent: 20
    - after_hours: 72
      increase_percent: 50
    - after_hours: 168
      increase_percent: 100
  
  # Maximum multiplier cap
  max_multiplier: 3.0
  
  # Auto-expire after this many hours
  expire_after_hours: 336  # 2 weeks
```

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fixflow

# GitHub App
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# MNEE
MNEE_API_KEY=your-mnee-api-key
MNEE_ENVIRONMENT=sandbox  # or production
MNEE_WALLET_WIF=your-wallet-wif
MNEE_WEBHOOK_SECRET=your-mnee-webhook-secret

# API Security
API_KEY_HASH=hashed-api-key-for-action
```

## Security Considerations

### Webhook Verification

All GitHub webhooks are verified using HMAC-SHA256:

```typescript
import crypto from 'crypto';

function verifyGitHubWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### API Authentication

The GitHub Action authenticates with the bot server using API keys:

```typescript
// Action sends
headers: {
  'Authorization': 'Bearer <API_KEY>',
  'X-Repository-ID': '<REPO_ID>'
}

// Server verifies
const isValid = await verifyAPIKey(req.headers.authorization);
```

### Payment Security

- Wallet WIF keys are stored securely in environment variables
- All payment transactions are logged in the audit table
- Balance checks before payment attempts
- Transaction verification via MNEE webhooks

## Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  bot:
    build: ./bot
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://fixflow:password@db:5432/fixflow
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=fixflow
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fixflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

## Technology Stack Summary

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5.x |
| Web Framework | Express.js |
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Payment | MNEE SDK (@mnee/ts-sdk) |
| GitHub Integration | Octokit |
| Job Scheduling | node-cron |
| Testing | Jest |
| Containerization | Docker |

## Next Steps

After reviewing this architecture, the implementation will proceed through the phases outlined in the todo list, starting with project setup and infrastructure.