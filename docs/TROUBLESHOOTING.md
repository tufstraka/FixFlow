# Bounty Hunter Troubleshooting Guide

## Table of Contents
- [Common Issues](#common-issues)
- [MNEE Payment Issues](#mnee-payment-issues)
- [Smart Contract Issues](#smart-contract-issues)
- [GitHub Integration Issues](#github-integration-issues)
- [Database Issues](#database-issues)
- [Debugging Tools](#debugging-tools)

## Common Issues

### Bot Not Starting

**Symptoms:**
- Bot crashes on startup
- "Module not found" errors
- Connection errors

**Solutions:**

1. **Check Node.js version:**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

2. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verify environment variables:**
   ```bash
   # Check all required variables are set
   node -e "console.log(require('dotenv').config())"
   ```

4. **Check MongoDB connection:**
   ```bash
   # Test connection
   mongosh "your-connection-string"
   ```

### API Endpoints Not Responding

**Symptoms:**
- 404 errors on API calls
- Timeouts
- Empty responses

**Solutions:**

1. **Check server status:**
   ```bash
   pm2 status
   pm2 logs bounty-hunter-bot
   ```

2. **Verify port availability:**
   ```bash
   lsof -i :3000
   ```

3. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

## MNEE Payment Issues

### Payment Failed - Insufficient Balance

**Error:**
```
Insufficient MNEE balance. Have X, need Y MNEE
```

**Solutions:**

1. **Check wallet balance:**
   ```javascript
   const balance = await mneeService.getBalance();
   console.log(`Balance: ${balance.balance} MNEE`);
   ```

2. **Fund the wallet:**
   - Transfer MNEE to bot address
   - Wait for confirmation
   - Retry payment

3. **Monitor balance:**
   ```javascript
   // Add to startup routine
   setInterval(async () => {
     const balance = await mneeService.getBalance();
     if (balance.balance < 100) {
       logger.warn('Low MNEE balance!');
     }
   }, 3600000); // Check hourly
   ```

### Payment Failed - Invalid Address

**Error:**
```
Invalid MNEE address
```

**Solutions:**

1. **Validate address format:**
   ```javascript
   const isValid = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
   ```

2. **Common issues:**
   - Extra whitespace
   - Wrong network address
   - Typos in address

3. **Test with known address:**
   ```javascript
   // Sandbox test address
   const testAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
   ```

### Transaction Timeout

**Error:**
```
Transaction timeout after 60 seconds
```

**Solutions:**

1. **Check MNEE network status:**
   ```javascript
   const config = await mnee.config();
   console.log('MNEE network:', config);
   ```

2. **Increase timeout:**
   ```javascript
   // In mneeService.js
   async waitForConfirmation(ticketId, maxAttempts = 60) {
     // Increased from 30 to 60 attempts
   }
   ```

3. **Check ticket status manually:**
   ```javascript
   const status = await mnee.getTxStatus(ticketId);
   console.log('Status:', status);
   ```

### API Key Issues

**Error:**
```
Invalid API key (401/403)
```

**Solutions:**

1. **Verify API key:**
   - Check environment matches key (sandbox/production)
   - Ensure no extra spaces in .env
   - Regenerate if necessary

2. **Test API key:**
   ```javascript
   const mnee = new MNEE({ 
     apiKey: process.env.MNEE_API_KEY,
     environment: process.env.MNEE_ENVIRONMENT 
   });
   const config = await mnee.config();
   ```

## Smart Contract Issues

### Contract Not Found

**Error:**
```
Contract not found at address 0x...
```

**Solutions:**

1. **Verify deployment:**
   ```bash
   # Check deployment file
   cat deployments/[network]-deployment.json
   ```

2. **Verify on Etherscan:**
   ```
   https://etherscan.io/address/[CONTRACT_ADDRESS]
   ```

3. **Check network:**
   ```javascript
   const network = await ethers.provider.getNetwork();
   console.log('Connected to:', network.name);
   ```

### Bot Not Authorized

**Error:**
```
Bot wallet is not authorized in BountyEscrow contract
```

**Solutions:**

1. **Check authorization:**
   ```javascript
   const isAuthorized = await bountyEscrow.authorizedBots(botAddress);
   console.log('Authorized:', isAuthorized);
   ```

2. **Authorize bot:**
   ```javascript
   // From contract owner account
   const tx = await bountyEscrow.authorizeBot(botAddress);
   await tx.wait();
   ```

### Gas Price Too High

**Error:**
```
Transaction underpriced
```

**Solutions:**

1. **Adjust gas settings:**
   ```javascript
   const gasPrice = await provider.getFeeData();
   const maxGasPrice = ethers.parseUnits('50', 'gwei');
   
   const tx = await contract.method({
     gasPrice: gasPrice.gasPrice > maxGasPrice ? maxGasPrice : gasPrice.gasPrice
   });
   ```

2. **Monitor gas prices:**
   ```javascript
   const gasPrice = await provider.getFeeData();
   console.log('Current gas:', ethers.formatUnits(gasPrice.gasPrice, 'gwei'), 'gwei');
   ```

## GitHub Integration Issues

### Webhook Not Receiving Events

**Symptoms:**
- No webhook calls logged
- Bounties not created automatically

**Solutions:**

1. **Verify webhook URL:**
   - Check GitHub App settings
   - Ensure URL is publicly accessible
   - Test with curl

2. **Check webhook secret:**
   ```javascript
   // Verify signature
   const signature = req.headers['x-hub-signature-256'];
   const verified = verifyWebhookSignature(payload, signature, secret);
   ```

3. **Review GitHub App permissions:**
   - Issues: Read & Write
   - Pull requests: Read & Write
   - Actions: Read

4. **Check recent deliveries:**
   - GitHub App settings > Advanced > Recent Deliveries
   - Look for failed deliveries
   - Redeliver if needed

### Cannot Create Issues

**Error:**
```
Resource not accessible by integration
```

**Solutions:**

1. **Check App installation:**
   - Ensure App is installed on repository
   - Verify repository permissions

2. **Test with GitHub API:**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/OWNER/REPO/issues
   ```

### PR Status Not Updating

**Symptoms:**
- Tests pass but bounty not claimed
- Status checks not appearing

**Solutions:**

1. **Check webhook events:**
   ```javascript
   // Log all webhook events
   logger.info(`Webhook event: ${req.headers['x-github-event']}`);
   logger.info(`Action: ${req.body.action}`);
   ```

2. **Verify PR has MNEE address:**
   ```javascript
   const address = extractMneeAddress(prBody + '\n' + comments.join('\n'));
   if (!address) {
     logger.warn('No MNEE address found in PR');
   }
   ```

## Database Issues

### Connection Timeout

**Error:**
```
MongoNetworkError: connection timed out
```

**Solutions:**

1. **Check connection string:**
   ```javascript
   // Test connection
   const { MongoClient } = require('mongodb');
   const client = new MongoClient(process.env.MONGODB_URI);
   await client.connect();
   console.log('Connected successfully');
   ```

2. **Whitelist IP address:**
   - Add server IP to MongoDB Atlas whitelist
   - Or use 0.0.0.0/0 for development

3. **Check network:**
   ```bash
   # Test connectivity
   nc -zv your-mongodb-host 27017
   ```

### Database Performance

**Symptoms:**
- Slow queries
- High memory usage

**Solutions:**

1. **Add indexes:**
   ```javascript
   // In Bounty model
   bountySchema.index({ bountyId: 1 });
   bountySchema.index({ repository: 1, status: 1 });
   bountySchema.index({ createdAt: -1 });
   ```

2. **Monitor slow queries:**
   ```javascript
   mongoose.set('debug', true);
   ```

3. **Optimize queries:**
   ```javascript
   // Use lean() for read-only operations
   const bounties = await Bounty.find({ status: 'active' }).lean();
   ```

## Debugging Tools

### Enable Debug Logging

```javascript
// In .env
DEBUG=bounty-hunter:*
LOG_LEVEL=debug

// In code
const debug = require('debug')('bounty-hunter:service');
debug('Detailed debugging info');
```

### MNEE SDK Debugging

```javascript
// Enable verbose logging
const mnee = new MNEE({
  apiKey: process.env.MNEE_API_KEY,
  environment: process.env.MNEE_ENVIRONMENT,
  debug: true  // Enables detailed logging
});
```

### Smart Contract Debugging

```javascript
// Listen to all contract events
bountyEscrow.on('*', (event) => {
  console.log('Contract event:', event);
});

// Get transaction receipt for debugging
const receipt = await tx.wait();
console.log('Gas used:', receipt.gasUsed.toString());
console.log('Events:', receipt.logs);
```

### HTTP Request Debugging

```javascript
// Log all HTTP requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    headers: req.headers,
    body: req.body,
    query: req.query
  });
  next();
});
```

### Database Query Debugging

```javascript
// Enable MongoDB query logging
mongoose.set('debug', (collectionName, method, query, doc) => {
  console.log(`${collectionName}.${method}`, JSON.stringify(query), doc);
});
```

## Performance Monitoring

### Memory Leaks

```javascript
// Monitor memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
  });
}, 60000);
```

### Response Time Monitoring

```javascript
// Add response time logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  next();
});
```

## Emergency Procedures

### Stop All Payments

```bash
# 1. Stop the bot
pm2 stop bounty-hunter-bot

# 2. Disable GitHub webhooks
# Go to GitHub App settings and disable webhooks

# 3. Transfer remaining MNEE to secure wallet
# Use MNEE wallet UI or SDK
```

### Rollback Deployment

```bash
# 1. Checkout previous version
git checkout [previous-commit-hash]

# 2. Reinstall dependencies
npm install

# 3. Restart services
pm2 restart bounty-hunter-bot
```

### Data Recovery

```bash
# 1. Export current data
mongodump --uri="mongodb://..." --out=backup/

# 2. Restore from backup
mongorestore --uri="mongodb://..." backup/
```

## Getting Help

If you're still experiencing issues:

1. **Check logs thoroughly:**
   ```bash
   pm2 logs bounty-hunter-bot --lines 1000
   ```

2. **Search existing issues:**
   https://github.com/bounty-hunter/bounty-hunter/issues

3. **Create detailed bug report:**
   - Error messages
   - Steps to reproduce
   - Environment details
   - Relevant logs

4. **Contact support:**
   - Discord: https://discord.gg/bounty-hunter
   - Email: support@bounty-hunter.io