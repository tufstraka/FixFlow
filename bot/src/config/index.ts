import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment configuration schema
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // GitHub App
  GITHUB_APP_ID: z.string().min(1, 'GITHUB_APP_ID is required'),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1, 'GITHUB_APP_PRIVATE_KEY is required'),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, 'GITHUB_WEBHOOK_SECRET is required'),

  // MNEE
  MNEE_API_KEY: z.string().min(1, 'MNEE_API_KEY is required'),
  MNEE_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  MNEE_WALLET_WIF: z.string().min(1, 'MNEE_WALLET_WIF is required'),
  MNEE_WEBHOOK_SECRET: z.string().optional(),

  // API Security
  API_KEY_HASH: z.string().min(1, 'API_KEY_HASH is required'),

  // Optional
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

const env = parseEnv();

/**
 * Application configuration
 */
export const config = {
  /**
   * Server configuration
   */
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  },

  /**
   * Database configuration
   */
  database: {
    url: env.DATABASE_URL,
  },

  /**
   * GitHub App configuration
   */
  github: {
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    webhookSecret: env.GITHUB_WEBHOOK_SECRET,
  },

  /**
   * MNEE configuration
   */
  mnee: {
    apiKey: env.MNEE_API_KEY,
    environment: env.MNEE_ENVIRONMENT as 'sandbox' | 'production',
    walletWif: env.MNEE_WALLET_WIF,
    webhookSecret: env.MNEE_WEBHOOK_SECRET,
  },

  /**
   * API security configuration
   */
  api: {
    keyHash: env.API_KEY_HASH,
  },

  /**
   * Logging configuration
   */
  logging: {
    level: env.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
export default config;