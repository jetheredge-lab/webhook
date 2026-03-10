import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifyHmacSignature } from '../middleware/hmac-verify';
import { IdempotencyManager } from '../utils/idempotency';
import { WebhookService } from '../services/webhook.service';
import { OrderQueueService } from '../services/order-queue.service';
import { logger } from '../utils/logger';

export default async function webhookRoutes(fastify: FastifyInstance) {
    // TradingView doesn't send standard headers, so verifyHmacSignature middleware checks the payload directly
    fastify.post('/tradingview', { preHandler: verifyHmacSignature }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = request.body as Record<string, any>;
            // Extract or build a synthetic idempotency key
            const synthKey = body.symbol + (body.date || '') + (body.quantity || '');
            const alertId = body.alert_id || Buffer.from(synthKey).toString('base64');

            // 1. Idempotency Gate
            const isNew = await IdempotencyManager.lockAlert(alertId);
            if (!isNew) {
                logger.warn(`Duplicate webhook blocked: ${alertId}`);
                return reply.status(200).send({ success: true, message: 'Already processed identical webhook.' });
            }

            // 2. Validate, map, and store initial log
            const ingestion = await WebhookService.parseAndIngest(body);

            if (!ingestion.success || !ingestion.webhookId) {
                return reply.status(400).send({ success: false, error: 'Payload validation failed' });
            }

            // 3. Enqueue execution context
            // Close/Reverse positions (usually stops/mitigation) have max priority
            const isCritical = body.close_position || body.reverse ? 1 : 2;

            await OrderQueueService.enqueueOrder(ingestion.webhookId, isCritical);

            return reply.status(200).send({ success: true, status: 'Queued' });
        } catch (error) {
            logger.error(error, 'Unhandled webhook exception:');
            return reply.status(500).send({ success: false, error: 'Internal Server Error' });
        }
    });
}
