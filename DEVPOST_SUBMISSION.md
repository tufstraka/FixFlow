# Bounty Hunter - Automated Debugging Bounties with MNEE Stablecoin

## 🎯 Project Description

Bounty Hunter revolutionizes open-source maintenance by automatically creating and managing bug bounties using MNEE stablecoin. When CI/CD tests fail, our system instantly creates a GitHub issue with an MNEE bounty tracked in a PostgreSQL database. Developers who fix the bugs receive automatic, instant payment in MNEE stablecoin when their pull requests pass all tests.

This demonstrates **programmable money** in action - value transfers automatically based on code events, with time-based escalation logic that increases bounty values to incentivize faster fixes.

## 💡 How We Use MNEE

Our system leverages MNEE stablecoin for automated payments:

1. **MNEE API Integration**: Direct payments using MNEE's native infrastructure
2. **PostgreSQL State Management**: Reliable, scalable tracking of bounty states
3. **Stable Value**: USD-backed MNEE ensures predictable bounty amounts
4. **Conditional Payments**: Automatic release when specific conditions are met
5. **Time-Based Logic**: Programmable escalation increases bounty values over time

### Architecture Benefits:
- **Simplicity**: No blockchain complexity, just reliable database operations
- **Speed**: Instant state updates without waiting for block confirmations
- **Cost-Effective**: No gas fees for state management
- **Native MNEE**: Uses MNEE's official payment infrastructure
- **Scalability**: PostgreSQL handles thousands of concurrent bounties

## ⚙️ Key Features

- **Automated Bounty Creation**: Test failures trigger instant bounty creation
- **Reliable State Tracking**: PostgreSQL ensures consistent bounty management
- **MNEE Native Payments**: Direct transfers using MNEE API
- **Time-Based Escalation**: Bounties increase by 20% (24h), 50% (72h), 100% (1 week)
- **Instant Payments**: MNEE automatically released when tests pass
- **Configurable Amounts**: Set bounties based on severity, test type, or custom rules
- **GitHub Native**: Seamless integration with GitHub Actions and webhooks

## 🏗️ Technical Architecture

### Backend Services
- **Node.js/Express**: API server for orchestration
- **PostgreSQL**: Primary database for all bounty state management
- **MNEE TypeScript SDK**: Native payment processing
- **GitHub App**: Monitors PRs and test results
- **Cron Jobs**: Handles time-based escalations

### Database Schema
```sql
CREATE TABLE bounties (
  id SERIAL PRIMARY KEY,
  bounty_id INTEGER UNIQUE NOT NULL,
  repository VARCHAR(255) NOT NULL,
  issue_id VARCHAR(255) NOT NULL,
  amount DECIMAL(18, 6) NOT NULL,
  max_amount DECIMAL(18, 6) NOT NULL,
  solver_address VARCHAR(255),
  state VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP,
  payment_tx_id VARCHAR(255),
  issue_url TEXT,
  metadata JSONB
);
```

### MNEE Integration
- **Wallet Management**: Secure MNEE address handling
- **Payment Processing**: Direct API calls for instant transfers
- **Transaction Tracking**: Payment IDs stored for verification
- **Balance Monitoring**: Real-time MNEE balance checks

### GitHub Integration
- **GitHub Action**: Detects test failures
- **Webhooks**: Monitor PR events
- **Issue Creation**: Automated bounty announcements
- **MNEE Address Extraction**: Parses solver addresses from PR comments

## 📺 Demo Video

[Watch our 5-minute demo](https://youtu.be/your-demo-link) showing:
1. Test failure triggering bounty creation
2. GitHub issue created with bounty details
3. Developer fixing the bug and adding MNEE address
4. Automatic MNEE payment via API on test success

## 🚀 Live Demo

- **Demo Repository**: [github.com/bounty-hunter/demo-repo](https://github.com/bounty-hunter/demo-repo)
- **Admin Dashboard**: [bounty-hunter-dashboard.vercel.app](https://bounty-hunter-dashboard.vercel.app)
- **API Endpoint**: [api.bounty-hunter.dev](https://api.bounty-hunter.dev)

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/bounty-hunter/bounty-hunter

# Install dependencies
cd bounty-hunter/bot
npm install

# Set up PostgreSQL database
createdb bounty_hunter
npm run db:migrate

# Configure MNEE credentials
cp .env.example .env
# Edit .env with your MNEE API credentials

# Start bot server
npm start
```

## 🔧 Usage

1. Add to your repository's workflow:

```yaml
name: Bounty Hunter
on:
  workflow_run:
    workflows: ["Tests"]
    types: [completed]

jobs:
  create-bounty:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - uses: bounty-hunter/bounty-hunter-action@v1
        with:
          bounty_amount: 50  # MNEE amount
```

2. Configure bounty amounts in `.bounty-hunter.yml`:

```yaml
bounty_config:
  default_amount: 50
  severity_multipliers:
    critical: 4.0
    high: 2.0
```

3. Developers claim bounties by adding their MNEE address in PR comments:
```
Fixed the failing test! 🎉
MNEE: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

## 🌟 Why This Matters

1. **Sustainable Open Source**: Automatically funds bug fixes
2. **Instant Incentives**: No waiting for manual bounty approval
3. **Fair Compensation**: Time-based escalation ensures market rates
4. **Simple & Reliable**: PostgreSQL ensures consistent state management
5. **Global Access**: Anyone can claim bounties with just a GitHub account

## 🏆 Track: Financial Automation

Bounty Hunter exemplifies financial automation by:
- **Automating Payments**: No manual intervention needed
- **Programmable Escalation**: Value increases based on time logic
- **Conditional Execution**: Payments only on verified test success
- **Treasury Management**: Organizations can fund bounty pools
- **Native MNEE Integration**: Uses MNEE's official payment infrastructure

## 📊 Technical Highlights

- **Clean Architecture**: Simple PostgreSQL state management
- **No Blockchain Complexity**: No gas fees or network delays
- **Highly Scalable**: Database handles thousands of concurrent bounties
- **Secure**: API authentication and secure payment handling
- **Observable**: Full logging and monitoring capabilities
- **Extensible**: Plugin architecture for custom bounty rules

## 👥 Team

- **Developer**: [Your Name]
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Contact**: your.email@example.com

## 📄 License

MIT License - Open source for the community!

## 🔗 Links

- **GitHub Repository**: [github.com/bounty-hunter/bounty-hunter](https://github.com/bounty-hunter/bounty-hunter)
- **Documentation**: [Full setup guide](https://github.com/bounty-hunter/bounty-hunter/blob/main/docs/SETUP.md)
- **MNEE Stablecoin**: [mnee.io](https://mnee.io)
- **MNEE Docs**: [docs.mnee.io](https://docs.mnee.io)
- **MNEE SDK**: [github.com/mnee-io/mnee-sdk-js](https://github.com/mnee-io/mnee-sdk-js)

---

Built with ❤️ for the MNEE Hackathon - Demonstrating the future of programmable money for automated financial workflows using MNEE's native infrastructure and reliable database state management!