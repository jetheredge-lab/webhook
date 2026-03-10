import { Queue } from 'bullmq';
import { redis, logger } from '../utils/logger';

export const orderQueue = new Queue('OrderExecutionQueue', {
    connection: redis as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    }
});

export class OrderQueueService {
    /**
     * Enqueues an order execution command parsed from a webhook into Redis.
     */
    static async enqueueOrder(webhookId: string, priorityLevel: number) {
        logger.info(`Enqueuing execution job for Webhook ID: ${webhookId}`);

        // Determine priority, e.g. Close positions need highest priority 1, regular orders 2
        await orderQueue.add(
            'ProcessTradovateOrder',
            { webhookId },
            { priority: priorityLevel, jobId: `trade-${webhookId}` }
        );
    }
}
