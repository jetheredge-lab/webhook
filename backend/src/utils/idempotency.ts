import { redis, logger } from './logger';

export class IdempotencyManager {
    /**
     * Checks if an alert_id has been processed recently (24 hour TTL).
     * Returns true if it NOT locked (processing can continue), false if already locked.
     */
    static async lockAlert(alertId: string): Promise<boolean> {
        const key = `webhook:idempotency:${alertId}`;
        try {
            // SETNX: Sets value only if it doesn't exist
            // Will return 1 if set (first time), 0 if it exists
            const isNew = await redis.setnx(key, '1');

            if (isNew === 1) {
                // Expire locking after 24 hours so mem doesn't leak indefinitely
                await redis.expire(key, 24 * 60 * 60);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(error, 'Error managing idempotency in Redis:');
            // In err fallback, assume unlocked to prevent system halts, though risky.
            return true;
        }
    }
}
