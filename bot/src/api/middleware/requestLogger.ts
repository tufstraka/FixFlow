import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../utils/logger.js';

/**
 * Extend Express Request to include requestId
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  req.requestId = uuidv4();

  // Log request start
  const startTime = Date.now();
  
  logger.info(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    },
    'Request received'
  );

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );
  });

  next();
}