import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import config from '../../config/index.js';
import { UnauthorizedError } from './errorHandler.js';
import logger from '../../utils/logger.js';

/**
 * Verify GitHub webhook signature
 * GitHub sends HMAC-SHA256 signature in X-Hub-Signature-256 header
 */
export function verifyGitHubWebhook(req: Request, _res: Response, next: NextFunction): void {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  
  if (!signature) {
    logger.warn('Missing X-Hub-Signature-256 header');
    throw new UnauthorizedError('Missing webhook signature');
  }

  // Body should be raw Buffer for webhooks
  const body = req.body as Buffer;
  if (!Buffer.isBuffer(body)) {
    logger.warn('Webhook body is not a buffer');
    throw new UnauthorizedError('Invalid webhook body format');
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', config.github.webhookSecret)
    .update(body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    logger.warn('Webhook signature length mismatch');
    throw new UnauthorizedError('Invalid webhook signature');
  }

  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    logger.warn('Webhook signature verification failed');
    throw new UnauthorizedError('Invalid webhook signature');
  }

  // Parse the raw body as JSON
  try {
    req.body = JSON.parse(body.toString('utf8'));
  } catch (error) {
    logger.error({ error }, 'Failed to parse webhook body');
    throw new UnauthorizedError('Invalid webhook body');
  }

  next();
}

/**
 * Verify MNEE webhook signature
 */
export function verifyMNEEWebhook(req: Request, _res: Response, next: NextFunction): void {
  if (!config.mnee.webhookSecret) {
    // Skip verification if no secret configured
    next();
    return;
  }

  const signature = req.headers['x-mnee-signature'] as string | undefined;
  
  if (!signature) {
    logger.warn('Missing X-MNEE-Signature header');
    throw new UnauthorizedError('Missing MNEE webhook signature');
  }

  const body = req.body as Buffer;
  if (!Buffer.isBuffer(body)) {
    logger.warn('MNEE webhook body is not a buffer');
    throw new UnauthorizedError('Invalid webhook body format');
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.mnee.webhookSecret)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )) {
    logger.warn('MNEE webhook signature verification failed');
    throw new UnauthorizedError('Invalid MNEE webhook signature');
  }

  // Parse the raw body as JSON
  try {
    req.body = JSON.parse(body.toString('utf8'));
  } catch (error) {
    logger.error({ error }, 'Failed to parse MNEE webhook body');
    throw new UnauthorizedError('Invalid webhook body');
  }

  next();
}