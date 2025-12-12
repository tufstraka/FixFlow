import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import logger from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './db/client.js';
import { healthRouter } from './api/routes/health.js';
import { bountyRouter } from './api/routes/bounties.js';
import { webhookRouter } from './api/routes/webhooks.js';
import { paymentRouter } from './api/routes/payments.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { startEscalationScheduler, stopEscalationScheduler } from './services/bounty/EscalationScheduler.js';

/**
 * Create and configure Express application
 */
function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Request logging
  app.use(requestLogger);

  // Body parsing - raw for webhooks, json for API
  app.use('/api/webhooks', express.raw({ type: 'application/json' }));
  app.use(express.json());

  // Routes
  app.use('/api/health', healthRouter);
  app.use('/api/bounties', bountyRouter);
  app.use('/api/webhooks', webhookRouter);
  app.use('/api/payments', paymentRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function start() {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start escalation scheduler
    startEscalationScheduler();

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      logger.info(
        { port: config.server.port, env: config.server.nodeEnv },
        `FixFlow Bot Server started on port ${config.server.port}`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Shutdown signal received');

      // Stop scheduler
      stopEscalationScheduler();

      // Close HTTP server
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Disconnect from database
      await disconnectDatabase();

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start().catch((error) => {
  logger.fatal({ error }, 'Unhandled error during startup');
  process.exit(1);
});