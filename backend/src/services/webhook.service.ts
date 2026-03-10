import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const webhookPayloadSchema = z.object({
    symbol: z.string(),
    date: z.string().optional(),
    data: z.string().optional(),
    quantity: z.union([
        z.number().positive(),
        z.string().regex(/^\d+$/).transform(Number)
    ]),
    risk_percentage: z.number().optional().default(0),
    price: z.union([z.number(), z.string()]).optional().nullable(),
    tp: z.number().optional().default(0),
    percentage_tp: z.number().optional().default(0),
    dollar_tp: z.number().optional().default(0),
    sl: z.number().optional().default(0),
    dollar_sl: z.number().optional().default(0),
    percentage_sl: z.number().optional().default(0),
    trail: z.number().optional().default(0),
    trail_stop: z.number().optional().default(0),
    trail_trigger: z.number().optional().default(0),
    trail_freq: z.number().optional().default(0),
    update_tp: z.boolean().optional().default(false),
    update_sl: z.boolean().optional().default(false),
    breakeven: z.number().optional().default(0),
    breakeven_offset: z.number().optional().default(0),
    token: z.string().optional(),
    pyramid: z.boolean().optional().default(true),
    same_direction_ignore: z.boolean().optional().default(false),
    reverse_order_close: z.boolean().optional().default(false),
    multiple_accounts: z.array(z.object({
        token: z.string().optional(),
        account_id: z.string(),
        risk_percentage: z.number().optional().default(0),
        quantity_multiplier: z.number().optional().default(1)
    })).optional().default([]),

    // Fallbacks for older structure
    alert_id: z.string().optional(),
    action: z.enum(['buy', 'sell']).optional(),
    order_type: z.enum(['market', 'limit', 'stop', 'stopLimit']).optional(),
    time_in_force: z.string().optional(),
    strategy: z.string().optional(),
    comment: z.string().optional(),
    secret: z.string().optional(),
    account_ids: z.array(z.string()).optional()
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

export class WebhookService {
    /**
     * Parses the webhook data against the expected canonical Zod schema,
     * stores safely into Prisma, and returns the DB model ID.
     */
    static async parseAndIngest(body: unknown) {
        const rawData = body as Record<string, any>;
        const parsedResult = webhookPayloadSchema.safeParse(rawData);

        if (!parsedResult.success) {
            logger.error(parsedResult.error.format(), 'Zod Validation Failure:');
            return { success: false, errors: parsedResult.error.format() };
        }

        const payload = parsedResult.data;

        let resolvedAction = payload.action || '';
        if (!resolvedAction && payload.data) {
            resolvedAction = payload.data.toLowerCase().includes('buy') ? 'buy' : 'sell';
        }

        // Create a pseudo-alert-id if not provided natively so idempotency hooks still work
        const alertId = payload.alert_id || `${payload.symbol}-${payload.date || Date.now()}-${Math.random().toString(36).substring(7)}`;

        const parsedQuantity = typeof payload.quantity === 'number' ? payload.quantity : parseFloat(payload.quantity) || 1;

        let parsedPrice = null;
        if (payload.price) {
            parsedPrice = typeof payload.price === 'number' ? payload.price : parseFloat(payload.price);
            if (isNaN(parsedPrice)) parsedPrice = null;
        }

        logger.info(`Valid webhook parsed: Symbol ${payload.symbol}`);

        try {
            const webhookDbEntry = await prisma.webhookAlert.create({
                data: {
                    rawPayload: rawData,
                    signatureValid: true,
                    alertId: alertId,
                    symbol: payload.symbol,
                    action: resolvedAction,
                    quantity: parsedQuantity,
                    orderType: payload.order_type || 'market',
                    price: parsedPrice,
                    stopLoss: payload.sl || null,
                    takeProfit: payload.tp || null,
                    trailStop: payload.trail_stop || null,
                    strategy: payload.strategy || 'unknown',
                    accountIds: payload.multiple_accounts.length > 0
                        ? payload.multiple_accounts.map((a: any) => a.account_id)
                        : (payload.account_ids || []),
                },
            });

            return { success: true, webhookId: webhookDbEntry.id };
        } catch (e: any) {
            if (e.code === 'P2002') {
                logger.warn(`Idempotency constraint hit at DB level for alert_id ${alertId}`);
            } else {
                logger.error(`Webhook DB Ingestion failed ${e.message}`);
            }
            return { success: false, errors: e };
        }
    }
}
