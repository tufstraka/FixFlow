require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { ethers } = require('ethers');
const cron = require('node-cron');

const logger = require('./utils/logger');
const authMiddleware = require('./middleware/auth');
const bountyRoutes = require('./routes/bounty');
const webhookRoutes = require('./routes/webhook');
const adminRoutes = require('./routes/admin');
const escalationService = require('./services/escalation');
const contractService = require('./services/contract');
const mneeService = require('./services/mnee');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/bounties', authMiddleware, bountyRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/webhook', webhookRoutes); // GitHub webhooks don't use our auth

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Database connection
async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize blockchain connection
async function initializeBlockchain() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Test connection
    const blockNumber = await provider.getBlockNumber();
    logger.info(`Connected to Sepolia at block ${blockNumber}`);
    
    // Initialize contract service
    await contractService.initialize(wallet);
    
    logger.info('Blockchain connection initialized');
  } catch (error) {
    logger.error('Blockchain initialization error:', error);
    process.exit(1);
  }
}

// Initialize MNEE payment service
async function initializeMneeService() {
  try {
    await mneeService.initialize();
    
    // Get initial balance
    const balance = await mneeService.getBalance();
    logger.info(`MNEE wallet balance: ${balance.balance} MNEE`);
    
    // Request from faucet if in sandbox mode and balance is low
    if (process.env.MNEE_ENVIRONMENT === 'sandbox' && balance.balance < 10) {
      logger.info('Low MNEE balance in sandbox, requesting from faucet...');
      try {
        await mneeService.requestFromFaucet();
      } catch (error) {
        logger.warn('Faucet request failed:', error.message);
      }
    }
    
    logger.info('MNEE payment service initialized');
  } catch (error) {
    logger.error('MNEE service initialization error:', error);
    process.exit(1);
  }
}

// Start escalation scheduler
function startEscalationScheduler() {
  const interval = process.env.ESCALATION_CHECK_INTERVAL || 3600000; // 1 hour default
  
  // Run every hour to check for bounties that need escalation
  cron.schedule('0 * * * *', async () => {
    logger.info('Running bounty escalation check...');
    try {
      await escalationService.checkAndEscalateBounties();
    } catch (error) {
      logger.error('Escalation check error:', error);
    }
  });
  
  logger.info('Escalation scheduler started');
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connection
  await mongoose.connection.close();
  logger.info('Database connection closed');
  
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Initialize blockchain
    await initializeBlockchain();
    
    // Initialize MNEE service
    await initializeMneeService();
    
    // Start escalation scheduler
    startEscalationScheduler();
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Bounty Hunter Bot running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
    
    // Store server reference for graceful shutdown
    global.server = server;
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();

module.exports = app;