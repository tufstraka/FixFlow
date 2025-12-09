# Bounty Hunter - Automated Debugging Bounties with MNEE Stablecoin

## 🎯 Project Description

Bounty Hunter revolutionizes open-source maintenance by automatically creating and managing bug bounties using MNEE stablecoin. When CI/CD tests fail, our system instantly creates a GitHub issue with an MNEE bounty tracked by smart contracts. Developers who fix the bugs receive automatic, instant payment in MNEE stablecoin when their pull requests pass all tests.

This demonstrates **programmable money** in action - value transfers automatically based on code events, with time-based escalation logic that increases bounty values to incentivize faster fixes.

## 💡 How We Use MNEE

Our system leverages MNEE stablecoin through a hybrid approach that combines the best of both worlds:

1. **MNEE API Integration**: Direct payments using MNEE's native infrastructure
2. **Smart Contract State Management**: Transparent, on-chain tracking of bounty states
3. **Stable Value**: USD-backed MNEE ensures predictable bounty amounts
4. **Conditional Payments**: Automatic release when specific conditions are met
5. **Time-Based Logic**: Programmable escalation increases bounty values over time

### Hybrid Architecture Benefits:
- **Transparency**: All bounty states are publicly verifiable on-chain
- **Native MNEE**: Uses MNEE's official payment infrastructure, not wrapped tokens
- **Gas Efficiency**: Only state changes go on-chain, payments use MNEE API
- **Security**: Smart contracts ensure only authorized bots can manage bounties

## ⚙️ Key Features

- **Automated Bounty Creation**: Test failures trigger instant bounty creation
- **Smart Contract State Tracking**: Transparent, on-chain bounty management
- **MNEE Native Payments**: Direct transfers using MNEE API
- **Time-Based Escalation**: Bounties increase by 20% (24h), 50% (72h), 100% (1 week)
- **Instant Payments**: MNEE automatically released when tests pass
- **Configurable Amounts**: Set bounties based on severity, test type, or custom rules
- **GitHub Native**: Seamless integration with GitHub Actions and webhooks

## 🏗️ Technical Architecture

### Smart Contracts
- **BountyEscrow.sol**: Manages bounty states and authorization
- Tracks bounty lifecycle (created → escalated → claimed)
- Stores MNEE transaction IDs for payment verification
- Deployed on Ethereum (mainnet) and Sepolia (testnet)

### MNEE Integration
- **MNEE TypeScript SDK**: Native payment processing
- **Wallet Management**: Secure MNEE address handling
- **Payment Verification**: Transaction ID tracking
- **Balance Monitoring**: Real-time MNEE balance checks

### Backend Services
- **Node.js/Express**: API server for orchestration
- **MongoDB**: Tracks bounty metadata and history
- **GitHub App**: Monitors PRs and test results
- **Cron Jobs**: Handles time-based escalations

### GitHub Integration
- **GitHub Action**: Detects test failures
- **Webhooks**: Monitor PR events
- **Issue Creation**: Automated bounty announcements
- **MNEE Address Extraction**: Parses solver addresses from PR comments

## 📺 Demo Video

[Watch our 5-minute demo](https://youtu.be/your-demo-link) showing:
1. Test failure triggering bounty creation
2. Smart contract state update
3. Developer fixing the bug and adding MNEE address
4. Automatic MNEE payment via API on test success

## 🚀 Live Demo

- **Demo Repository**: [github.com/bounty-hunter/demo-repo](https://github.com/bounty-hunter/demo-repo)
- **Admin Dashboard**: [bounty-hunter-dashboard.vercel.app](https://bounty-hunter-dashboard.vercel.app)
- **Smart Contract (Sepolia)**: [0xYourContractAddress](https://sepolia.etherscan.io/address/0xYourContractAddress)

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/bounty-hunter/bounty-hunter

# Install dependencies
cd bounty-hunter
npm install

# Deploy contracts
cd contracts
npm run deploy

# Configure MNEE credentials
cd ../bot
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
4. **Transparent & Trustless**: On-chain state with native MNEE payments
5. **Global Access**: Anyone can claim bounties with just a GitHub account

## 🏆 Track: Financial Automation

Bounty Hunter exemplifies financial automation by:
- **Automating Payments**: No manual intervention needed
- **Programmable Escalation**: Value increases based on time logic
- **Conditional Execution**: Payments only on verified test success
- **Treasury Management**: Organizations can fund bounty pools
- **Native MNEE Integration**: Uses MNEE's official payment infrastructure

## 📊 Technical Highlights

- **Hybrid Architecture**: Combines smart contracts with MNEE API
- **Gas Efficient**: Only state changes go on-chain
- **Secure**: Multi-signature authorization for bot wallets
- **Scalable**: Can handle thousands of bounties across repositories
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

Built with ❤️ for the MNEE Hackathon - Demonstrating the future of programmable money for automated financial workflows using MNEE's native infrastructure!