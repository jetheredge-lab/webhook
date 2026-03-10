import { describe, it, expect } from 'vitest';
import { webhookPayloadSchema, WebhookService } from '../src/services/webhook.service';

describe('Webhook Ingestion Logic', () => {
    it('should validate canonical payload', () => {
        const payload = {
            alert_id: 'test_123',
            symbol: 'MESZ4',
            action: 'buy',
            order_type: 'market',
            quantity: 1,
            strategy: 'TestStrat',
            secret: 'change_me_webhook',
            account_ids: ['ID_1']
        };

        const parsed = webhookPayloadSchema.safeParse(payload);
        expect(parsed.success).toBe(true);
    });

    it('should throw on negative quantities', () => {
        const payload = {
            alert_id: 'test_123',
            symbol: 'MESZ4',
            action: 'buy',
            order_type: 'market',
            quantity: -1, // invalid
            strategy: 'TestStrat',
            secret: 'valid_sec',
            account_ids: ['ID_1']
        };
        const parsed = webhookPayloadSchema.safeParse(payload);
        expect(parsed.success).toBe(false);
    });
});
