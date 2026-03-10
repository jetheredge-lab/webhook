import crypto from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { logger } from '../utils/logger';

export const verifyHmacSignature = async (
    request: FastifyRequest,
    reply: FastifyReply
) => {
    try {
        const rawPayload = JSON.stringify(request.body);
        const bodyObj = request.body as any;

        if (!bodyObj || !bodyObj.secret) {
            logger.warn('Webhook rejected: Missing secret field in payload');
            return reply.status(401).send({ error: 'Unauthorized: Missing secret' });
        }

        // TradingView doesn't support headers for webhook auth easily, so we verify a secret key inside JSON securely.
        // In production, you might compute an HMAC-SHA256 of the body excluding the secret and verify against the header,
        // but the problem statement assumes TV sends the 'secret' property string matching our env WEBHOOK_SECRET.
        // We use a constant-time comparison to prevent timing attacks.

        const expectedSecret = config.WEBHOOK_SECRET;
        const providedSecret = bodyObj.secret;

        if (
            expectedSecret.length !== providedSecret.length ||
            !crypto.timingSafeEqual(Buffer.from(expectedSecret), Buffer.from(providedSecret))
        ) {
            logger.warn('Webhook rejected: Invalid secret key');
            return reply.status(401).send({ error: 'Unauthorized: Invalid secret' });
        }
    } catch (error) {
        logger.error(error, 'HMAC verification failed:');
        return reply.status(401).send({ success: false, error: 'Invalid HMAC signature' });
    }
};
