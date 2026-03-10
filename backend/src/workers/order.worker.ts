import { Worker, Job } from 'bullmq';
import { redis, logger } from '../utils/logger';
import { PrismaClient, OrderAction, TradovateOrderType, OrderStatus } from '@prisma/client';
import { TradovateOrderService, PlaceOrderPayload } from '../services/tradovate/order.service';

const prisma = new PrismaClient();

const actionMap: Record<string, OrderAction> = {
    'buy': OrderAction.BUY,
    'sell': OrderAction.SELL
};

const mapOrderType = (input: string): TradovateOrderType => {
    switch (input.toLowerCase()) {
        case 'market': return TradovateOrderType.MARKET;
        case 'limit': return TradovateOrderType.LIMIT;
        case 'stop': return TradovateOrderType.STOP;
        case 'stoplimit': return TradovateOrderType.STOP_LIMIT;
        default: return TradovateOrderType.MARKET;
    }
};

const mapTradovateAction = (action: string) => action.toLowerCase() === 'buy' ? 'Buy' : 'Sell';
const mapTradovateType = (type: string) => {
    const map: Record<string, PlaceOrderPayload['orderType']> = {
        'market': 'Market',
        'limit': 'Limit',
        'stop': 'Stop',
        'stoplimit': 'StopLimit'
    };
    return map[type.toLowerCase()] || 'Market';
}

export const initOrderWorker = () => {
    const worker = new Worker('OrderExecutionQueue', async (job: Job) => {
        const { webhookId } = job.data;
        logger.info(`Worker processing job ${job.id} for Webhook ID: ${webhookId}`);

        const webhook = await prisma.webhookAlert.findUnique({
            where: { id: webhookId }
        });

        if (!webhook) throw new Error(`Webhook ${webhookId} not found in DB`);

        for (const sysAccountId of webhook.accountIds) {
            try {
                logger.debug(`Placing mapped order for Account ${sysAccountId}`);

                // Build generic REST payload mapping
                const payload: PlaceOrderPayload = {
                    accountId: 0, // Ignored logic inside generic call but required interface internally
                    accountSpec: '', // Populated organically inside TradovateOrderService placeholder mapping
                    action: mapTradovateAction(webhook.action),
                    symbol: webhook.symbol,
                    orderQty: webhook.quantity,
                    orderType: mapTradovateType(webhook.orderType),
                    price: webhook.price,
                    stopPrice: webhook.stopLoss, // Typically in pure API terms
                    isAutomated: true
                };

                const res = await TradovateOrderService.placeOrder(sysAccountId, payload);

                // Store standard representation
                await prisma.order.create({
                    data: {
                        webhookAlertId: webhook.id,
                        accountId: sysAccountId,
                        tradovateOrderId: res.orderId?.toString(),
                        symbol: webhook.symbol,
                        action: actionMap[webhook.action] || OrderAction.BUY,
                        quantity: webhook.quantity,
                        orderType: mapOrderType(webhook.orderType),
                        status: OrderStatus.PENDING,
                        isAutomated: true,
                        notes: `Placed via queue job ${job.id}`
                    }
                });

            } catch (err: any) {
                logger.error(`Failed executing job payload across sysAccount ${sysAccountId}`, err);
                throw err; // Allow BullMQ retry strategy
            }
        }

        // Flag processed state True when loop completely successes.
        await prisma.webhookAlert.update({
            where: { id: webhookId },
            data: { processed: true, processingError: null }
        });

    }, { connection: redis as any });

    worker.on('failed', async (job, err) => {
        logger.error(`Job ID ${job?.id} failed ultimately. Reason: ${err.message}`);
        // Update db with error flag
        if (job?.data?.webhookId) {
            await prisma.webhookAlert.update({
                where: { id: job.data.webhookId },
                data: { processingError: err.message, processed: true } // marked processed but failed
            });
        }
    });

    return worker;
};
