import cron from 'node-cron';
import { bountyService } from './BountyService.js';
import logger from '../../utils/logger.js';

let escalationTask: cron.ScheduledTask | null = null;
let expirationTask: cron.ScheduledTask | null = null;

const log = logger.child({ service: 'EscalationScheduler' });

/**
 * Process bounty escalations
 */
async function processEscalations(): Promise<void> {
  log.debug('Processing bounty escalations');

  try {
    const bountiesForEscalation = await bountyService.getBountiesForEscalation();

    for (const { bounty, nextEscalation } of bountiesForEscalation) {
      try {
        await bountyService.escalateBounty(bounty.id, nextEscalation);
        log.info(
          { bountyId: bounty.id, previousAmount: bounty.currentAmount, newAmount: nextEscalation },
          'Bounty escalated'
        );
      } catch (error) {
        log.error({ error, bountyId: bounty.id }, 'Failed to escalate bounty');
      }
    }

    if (bountiesForEscalation.length > 0) {
      log.info({ count: bountiesForEscalation.length }, 'Processed bounty escalations');
    }
  } catch (error) {
    log.error({ error }, 'Error processing escalations');
  }
}

/**
 * Process bounty expirations
 */
async function processExpirations(): Promise<void> {
  log.debug('Processing bounty expirations');

  try {
    const expiredBounties = await bountyService.getExpiredBounties();

    for (const bounty of expiredBounties) {
      try {
        await bountyService.expireBounty(bounty.id);
        log.info({ bountyId: bounty.id }, 'Bounty expired');
      } catch (error) {
        log.error({ error, bountyId: bounty.id }, 'Failed to expire bounty');
      }
    }

    if (expiredBounties.length > 0) {
      log.info({ count: expiredBounties.length }, 'Processed bounty expirations');
    }
  } catch (error) {
    log.error({ error }, 'Error processing expirations');
  }
}

/**
 * Start the escalation scheduler
 * Runs every hour to check for bounties that need escalation
 */
export function startEscalationScheduler(): void {
  log.info('Starting escalation scheduler');

  // Run escalation check every hour
  escalationTask = cron.schedule('0 * * * *', () => {
    processEscalations().catch((error) => {
      log.error({ error }, 'Escalation task failed');
    });
  });

  // Run expiration check every 15 minutes
  expirationTask = cron.schedule('*/15 * * * *', () => {
    processExpirations().catch((error) => {
      log.error({ error }, 'Expiration task failed');
    });
  });

  log.info('Escalation scheduler started');

  // Run immediately on startup
  processEscalations().catch((error) => {
    log.error({ error }, 'Initial escalation check failed');
  });
  processExpirations().catch((error) => {
    log.error({ error }, 'Initial expiration check failed');
  });
}

/**
 * Stop the escalation scheduler
 */
export function stopEscalationScheduler(): void {
  log.info('Stopping escalation scheduler');

  if (escalationTask) {
    escalationTask.stop();
    escalationTask = null;
  }

  if (expirationTask) {
    expirationTask.stop();
    expirationTask = null;
  }

  log.info('Escalation scheduler stopped');
}