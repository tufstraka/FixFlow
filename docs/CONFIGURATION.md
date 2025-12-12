# FixFlow Configuration Reference

This document details all configuration options available in FixFlow.

## Table of Contents

1. [Repository Configuration](#repository-configuration)
2. [Environment Variables](#environment-variables)
3. [Bounty Escalation](#bounty-escalation)
4. [Severity Detection](#severity-detection)
5. [GitHub Action Configuration](#github-action-configuration)

---

## Repository Configuration

Each repository can have a `.bounty-hunter.yml` (or `.fixflow.yml`) configuration file in the root directory.

### Full Configuration Example

```yaml
# .bounty-hunter.yml

bounty_config:
  # Default bounty amount in MNEE
  default_amount: 75
  
  # Minimum bounty amount
  min_amount: 25
  
  # Maximum bounty amount (before escalation)
  max_amount: 500

  # Severity multipliers - applied to default_amount
  severity_multipliers:
    critical: 4.0    # 75 × 4.0 = 300 MNEE
    high: 2.0        # 75 × 2.0 = 150 MNEE
    medium: 1.0      # 75 × 1.0 = 75 MNEE
    low: 0.5         # 75 × 0.5 = 37.5 MNEE

  # Escalation configuration
  escalation:
    enabled: true
    # Maximum multiplier for escalation
    max_multiplier: 3.0
    # Escalation schedule
    schedule:
      - hours: 24
        increase_percent: 20
      - hours: 72
        increase_percent: 50
      - hours: 168  # 1 week
        increase_percent: 100

  # Auto-approve bounties under this threshold
  auto_approve_threshold: 100
  
  # Require manual approval for bounties above this
  manual_approval_threshold: 250

  # Labels to add to bounty issues
  labels:
    - "bounty"
    - "help wanted"
    - "good first issue"

  # Assignees for bounty issues (GitHub usernames)
  assignees: []

# Workflow patterns to watch
workflows:
  # Workflows that trigger bounties on failure
  watched:
    - "CI"
    - "Tests"
    - "Build"
    - "Integration Tests"
  
  # Workflows to ignore
  ignored:
    - "Lint"
    - "Format Check"

# Test name patterns for severity detection
severity_patterns:
  critical:
    - "auth"
    - "security"
    - "payment"
    - "transaction"
  high:
    - "database"
    - "api"
    - "integration"
  medium:
    - "service"
    - "controller"
  low:
    - "util"
    - "helper"
    - "format"

# Notification settings
notifications:
  # Slack webhook URL
  slack_webhook: ""
  
  # Discord webhook URL
  discord_webhook: ""
  
  # Email notifications
  email:
    enabled: false
    recipients: []

# Advanced settings
advanced:
  # Timeout for bounty claims (hours)
  claim_timeout: 168  # 7 days
  
  # Timeout for bounty expiration (hours)
  expiration_timeout: 720  # 30 days
  
  # Allow multiple claimants
  allow_multiple_claims: false
  
  # Require PR to be linked to issue
  require_linked_pr: true
```

### Minimal Configuration

```yaml
# .bounty-hunter.yml
bounty_config:
  default_amount: 50
```

---

## Environment Variables

### Bot Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `GITHUB_APP_ID` | Yes | - | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Yes | - | GitHub App private key (PEM) |
| `GITHUB_WEBHOOK_SECRET` | Yes | - | Webhook signature secret |
| `MNEE_API_KEY` | Yes | - | MNEE API key |
| `MNEE_WALLET_WIF` | Yes | - | MNEE wallet private key |
| `MNEE_WEBHOOK_SECRET` | No | - | MNEE webhook secret |
| `MNEE_ENVIRONMENT` | No | `sandbox` | `sandbox` or `production` |
| `API_KEY_HASH` | Yes | - | SHA256 hash of API key |
| `LOG_LEVEL` | No | `info` | Logging level |

### Dashboard

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | - | Bot server URL |
| `PORT` | No | `3001` | Dashboard port |

### Docker Compose

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_PORT` | No | `3000` | Exposed bot port |
| `DASHBOARD_PORT` | No | `3001` | Exposed dashboard port |
| `DB_PORT` | No | `5432` | Exposed database port |
| `POSTGRES_USER` | No | `fixflow` | Database user |
| `POSTGRES_PASSWORD` | Yes | - | Database password |
| `POSTGRES_DB` | No | `fixflow` | Database name |

---

## Bounty Escalation

Bounties automatically increase in value over time to attract contributors.

### Escalation Schedule

Default schedule:

| Time Elapsed | Increase | Example (75 MNEE base) |
|--------------|----------|------------------------|
| 24 hours | +20% | 90 MNEE |
| 72 hours | +50% | 112.5 MNEE |
| 1 week | +100% | 150 MNEE |

### Escalation Cap

Bounties are capped at `max_multiplier × original_amount` (default: 3×).

### Custom Escalation

```yaml
escalation:
  enabled: true
  max_multiplier: 5.0
  schedule:
    - hours: 12
      increase_percent: 10
    - hours: 48
      increase_percent: 25
    - hours: 96
      increase_percent: 50
    - hours: 168
      increase_percent: 100
    - hours: 336
      increase_percent: 200
```

### Disabling Escalation

```yaml
escalation:
  enabled: false
```

---

## Severity Detection

FixFlow automatically detects bounty severity based on test names and failure context.

### Detection Rules

1. **Test Name Patterns**: Match against configured patterns
2. **File Path Analysis**: Detect critical paths (auth, payment, etc.)
3. **Workflow Context**: Consider which workflow failed

### Default Severity Patterns

```yaml
severity_patterns:
  critical:
    - "auth"
    - "security"
    - "payment"
    - "transaction"
    - "encryption"
    - "password"
    - "token"
    - "session"
  high:
    - "database"
    - "api"
    - "integration"
    - "connection"
    - "network"
  medium:
    - "service"
    - "controller"
    - "handler"
    - "processor"
  low:
    - "util"
    - "helper"
    - "format"
    - "style"
    - "lint"
```

### Custom Severity Patterns

```yaml
severity_patterns:
  critical:
    - "checkout"
    - "stripe"
    - "billing"
  high:
    - "user"
    - "profile"
```

### Severity Multipliers

| Severity | Default Multiplier | Example (75 MNEE) |
|----------|-------------------|-------------------|
| Critical | 4.0× | 300 MNEE |
| High | 2.0× | 150 MNEE |
| Medium | 1.0× | 75 MNEE |
| Low | 0.5× | 37.5 MNEE |

---

## GitHub Action Configuration

### Action Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github_token` | Yes | - | GitHub token for API access |
| `bot_server_url` | Yes | - | FixFlow bot server URL |
| `bot_api_key` | Yes | - | API key for bot server |
| `bounty_amount` | No | `75` | Default bounty amount |
| `config_file` | No | `.bounty-hunter.yml` | Config file path |

### Basic Workflow

```yaml
name: FixFlow

on:
  workflow_run:
    workflows: ["CI", "Tests"]
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

### Advanced Workflow

```yaml
name: FixFlow

on:
  workflow_run:
    workflows: ["CI", "Tests", "E2E"]
    types: [completed]

jobs:
  bounty:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Create Bounty
        uses: fixflow/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.FIXFLOW_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
          bounty_amount: 100
          config_file: .github/fixflow.yml
```

### Conditional Bounties

```yaml
jobs:
  bounty:
    runs-on: ubuntu-latest
    if: |
      github.event.workflow_run.conclusion == 'failure' &&
      github.event.workflow_run.head_branch == 'main'
    steps:
      - uses: fixflow/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.FIXFLOW_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
```

### Environment-Specific Configuration

```yaml
jobs:
  bounty:
    runs-on: ubuntu-latest
    environment: production
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - uses: fixflow/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ vars.FIXFLOW_URL }}
          bot_api_key: ${{ secrets.FIXFLOW_API_KEY }}
          bounty_amount: ${{ vars.DEFAULT_BOUNTY }}
```

---

## Claim Command Syntax

Users claim bounties by commenting on the bounty issue:

```
/claim <wallet-address>
```

### Examples

```
/claim 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

```
/claim bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
```

### Wallet Address Validation

FixFlow validates wallet addresses before accepting claims:
- Must be non-empty
- Must match expected format patterns
- Can be customized via configuration

---

## Issue Labels

FixFlow adds labels to bounty issues for easy filtering:

### Default Labels

- `bounty` - Marks issue as a bounty
- `bounty:active` - Bounty is available
- `bounty:claimed` - Bounty has been claimed
- `bounty:completed` - Bounty was paid out
- `severity:critical` - Critical severity
- `severity:high` - High severity
- `severity:medium` - Medium severity
- `severity:low` - Low severity

### Custom Labels

```yaml
labels:
  - "bounty"
  - "help wanted"
  - "good first issue"
  - "sponsored"
```

---

## Database Configuration

### PostgreSQL Connection String

Format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

Examples:
```bash
# Local
DATABASE_URL=postgresql://fixflow:password@localhost:5432/fixflow

# Docker
DATABASE_URL=postgresql://fixflow:password@db:5432/fixflow

# Cloud (with SSL)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Connection Pool

Default pool settings in Prisma:
- `connection_limit`: 10
- `pool_timeout`: 10 seconds

For high-traffic deployments:
```
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
```

---

## Logging Configuration

### Log Levels

| Level | Description |
|-------|-------------|
| `error` | Only errors |
| `warn` | Errors and warnings |
| `info` | General information (default) |
| `debug` | Detailed debugging |
| `verbose` | Very detailed output |

### Setting Log Level

```bash
LOG_LEVEL=debug
```

### Log Format

Logs are output in JSON format for easy parsing:

```json
{
  "level": "info",
  "message": "Bounty created",
  "bountyId": "clx123",
  "repository": "acme/app",
  "timestamp": "2024-01-15T10:30:00.000Z"
}