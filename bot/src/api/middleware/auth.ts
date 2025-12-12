import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../../config/index.js';
import { UnauthorizedError } from './errorHandler.js';
import logger from '../../utils/logger.js';

/**
 * Extend Express Request to include authenticated info
 */
declare global {
  namespace Express {
    interface Request {
      apiKeyValid?: boolean;
    }
  }
}

/**
 * Verify API key using constant-time comparison
 */
function verifyApiKey(providedKey: string): boolean {
  const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
  const expectedHash = config.api.keyHash;
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(providedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

/**
 * API key authentication middleware
 * Expects: Authorization: Bearer <api-key>
 */
export function apiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const [type, key] = authHeader.split(' ');

  if (type !== 'Bearer' || !key) {
    throw new UnauthorizedError('Invalid Authorization header format. Expected: Bearer <api-key>');
  }

  try {
    if (!verifyApiKey(key)) {
      logger.warn({ ip: req.ip }, 'Invalid API key attempt');
      throw new UnauthorizedError('Invalid API key');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    logger.error({ error }, 'Error verifying API key');
    throw new UnauthorizedError('Invalid API key');
  }

  req.apiKeyValid = true;
  next();
}

/**
 * Optional API key authentication - doesn't fail if missing
 */
export function optionalApiKeyAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const [type, key] = authHeader.split(' ');
    if (type === 'Bearer' && key) {
      try {
        req.apiKeyValid = verifyApiKey(key);
      } catch {
        req.apiKeyValid = false;
      }
    }
  }

  next();
}