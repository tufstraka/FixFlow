# 🎯 Bounty Hunter - Automated Debugging Bounty System

**Monetize open-source maintenance automatically using MNEE stablecoin bounties on failing tests!**

## 🏆 MNEE Hackathon Submission

This project is built for the **MNEE Hackathon** under the **Financial Automation** track. It demonstrates programmable money for automated financial workflows by creating an autonomous system that pays developers for fixing bugs.

## 🚀 Overview

Bounty Hunter is a GitHub bot that automatically creates cryptocurrency bounties when CI/CD pipelines fail. When developers submit pull requests that fix the failing tests, they automatically receive MNEE stablecoin payments.

### Key Features

- ✅ **Automated Bounty Creation**: Failing tests trigger automatic bounty creation
- 💰 **MNEE Stablecoin Payments**: Uses USD-backed MNEE for stable, predictable rewards
- 📈 **Time-Based Escalation**: Bounties increase automatically over time if not claimed
- 🔒 **Transparent State Management**: All bounty states tracked in PostgreSQL
- 🎯 **Instant Payment**: Successful fixes trigger automatic MNEE release via API
- 📊 **Admin Dashboard**: Monitor active bounties and system metrics
- 🔧 **Flexible Configuration**: Repository-specific settings and overrides

## 💡 How It Demonstrates Programmable Money

1. **Automated Value Transfer**: MNEE moves automatically based on code events (test failures/fixes)
2. **Transparent State Tracking**: PostgreSQL database provides full audit trail
3. **Time-Based Logic**: Programmable escalation increases bounty value over time
4. **Conditional Payments**: MNEE is only released when specific conditions are met (tests pass)

## 📋 How It Works

1. **Test Failure Detection**: GitHub Actions detect when tests fail in your CI/CD pipeline
2. **Bounty Creation**: The bot creates a GitHub issue and records the bounty in PostgreSQL
3. **Developer Fixes**: A developer submits a PR that fixes the failing tests
4. **Automatic Verification**: The system verifies tests are passing
5. **Instant Payment**: MNEE stablecoin is automatically sent via MNEE API

## 🏗️ Architecture

```
bounty-hunter/
├── bot/               # GitHub bot backend server
├── github-action/     # GitHub Action for CI/CD integration
├── dashboard/         # Admin monitoring dashboard
├── tests/            # Test suites
├── scripts/          # Deployment and utility scripts
└── docs/             # Documentation
```

### Technology Stack

- **Backend**: Node.js, Express, PostgreSQL
- **Payments**: MNEE API for direct stablecoin transfers
- **GitHub Integration**: GitHub App, GitHub Actions
- **Frontend**: HTML/CSS/JavaScript (admin dashboard)

## 🔧 Quick Start

### 1. Set Up Database

```bash
# Make sure PostgreSQL is installed
createdb bounty_hunter_bot
```

### 2. Set Up Bot Server

```bash
cd bot
npm install
cp .env.example .env
# Configure .env with your settings
npm start
```

### 3. Add to Your Repository

Create `.github/workflows/bounty-hunter.yml`:

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
          github_token: ${{ secrets.GITHUB_TOKEN }}
          bot_server_url: ${{ secrets.BOUNTY_HUNTER_URL }}
          bot_api_key: ${{ secrets.BOUNTY_HUNTER_API_KEY }}
          bounty_amount: 50
```

## 💸 Bounty Configuration

### Default Configuration

- **Base Amount**: 50 MNEE
- **Escalation**: +20% (24h), +50% (72h), +100% (1 week)
- **Maximum**: 3x initial amount

### Custom Configuration

Create `.bounty-hunter.yml` in your repository:

```yaml
bounty_config:
  default_amount: 75
  severity_multipliers:
    critical: 4.0
    high: 2.0
    medium: 1.0
    low: 0.5
```

## 📈 Bounty Escalation

Unclaimed bounties automatically increase over time:

| Time Elapsed | Increase | Example (50 MNEE start) |
|--------------|----------|-------------------------|
| 24 hours     | +20%     | 60 MNEE                |
| 72 hours     | +50%     | 75 MNEE                |
| 1 week       | +100%    | 100 MNEE               |

## 🔐 Security

- All bounty states stored securely in PostgreSQL
- MNEE payments use secure API authentication
- GitHub webhook signatures are verified
- API endpoints require authentication
- Full audit trail of all transactions

## 📊 Admin Dashboard

Access the admin dashboard to:
- Monitor active bounties
- View MNEE wallet balance
- Track contributor statistics
- Export bounty data

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [Architecture](bounty-hunter-architecture.md) - System design overview
- [Configuration](bounty-configuration-design.md) - Configuration options
- [Escalation](bounty-escalation-design.md) - Escalation system details
- [API Reference](docs/API_REFERENCE.md) - API documentation
- [MNEE Integration](docs/MNEE_SDK_INTEGRATION.md) - MNEE payment details

## 🎯 Use Cases

- **Open Source Projects**: Incentivize bug fixes with stable USD-backed rewards
- **Enterprise**: Create internal bug bounty programs with predictable costs
- **DAOs**: Automate contributor payments for maintenance tasks
- **Education**: Teach debugging with real monetary incentives

## 🌟 Why MNEE Stablecoin?

- **Stable Value**: USD-backed means predictable bounty values
- **Programmable**: Perfect for automated financial workflows
- **Native API**: Direct payments without blockchain complexity
- **Low Volatility**: Developers know exactly what they'll earn

## 🚀 Benefits of Our Architecture

- **No Gas Fees**: Direct MNEE API payments avoid blockchain transaction costs
- **Instant Operations**: Database operations are immediate, no waiting for confirmations
- **Simple Setup**: No smart contract deployment or blockchain configuration needed
- **Full Transparency**: PostgreSQL provides complete audit trail
- **Easy Updates**: Business logic changes don't require contract redeployment

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built with ❤️ for the MNEE Hackathon.

Special thanks to:
- MNEE team for creating programmable money infrastructure
- GitHub for their amazing API and Actions platform
- PostgreSQL for reliable state management

---
## 163jN4jSfLaAauZqL4znAHAgC9N5f4FeRr
**Ready to automate your bug bounties with MNEE?** [Get Started](docs/SETUP.md) →

**Learn more about MNEE stablecoin:** [mnee.io](https://mnee.io)