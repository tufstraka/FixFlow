import { Router, Request, Response } from 'express';
import { prisma } from '../../db/client.js';
import config from '../../config/index.js';
import type { HealthCheckResponse } from '@fixflow/shared';

export const healthRouter = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
healthRouter.get('/', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  // Check database connection
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  // Calculate uptime
  const uptime = process.uptime();

  const response: HealthCheckResponse = {
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime,
    services: {
      database: dbStatus,
      github: 'connected', // Assume connected if server is running
      mnee: 'connected', // Assume connected if server is running
    },
  };

  const statusCode = response.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(response);
});

/**
 * GET /api/health/ready
 * Readiness probe - checks if the service is ready to accept traffic
 */
healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false, error: 'Database not ready' });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - checks if the service is alive
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ alive: true });
});