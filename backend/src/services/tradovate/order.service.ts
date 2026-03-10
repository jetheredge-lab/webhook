import axios from 'axios';
import { TradovateAuthService } from './auth.service';
import { PrismaClient, AccountType } from '@prisma/client';
import { config } from '../../config';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface PlaceOrderPayload {
    accountSpec: string;
    accountId: number;
    action: 'Buy' | 'Sell';
    symbol: string;
    orderQty: number;
    orderType: 'Market' | 'Limit' | 'Stop' | 'StopLimit';
    price?: number | null;
    stopPrice?: number | null;
    isAutomated: boolean;
}

export class TradovateOrderService {
    static async _client(systemAccountId: string) {
        const dbAccount = await prisma.account.findUnique({ where: { id: systemAccountId } });
        if (!dbAccount) throw new Error('Account not found');

        const token = await TradovateAuthService.getAccessToken(systemAccountId);
        const baseURL =
            dbAccount.type === AccountType.LIVE ? config.TRADOVATE_API_URL_LIVE : config.TRADOVATE_API_URL_DEMO;

        return axios.create({
            baseURL,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Places an order directly to Tradovate via REST API
     */
    static async placeOrder(systemAccountId: string, payload: PlaceOrderPayload) {
        try {
            const dbAccount = await prisma.account.findUnique({ where: { id: systemAccountId } });
            const client = await this._client(systemAccountId);

            const res = await client.post('/order/placeorder', {
                accountSpec: dbAccount?.accountSpec,
                accountId: Number(dbAccount?.tradovateAccountId),
                action: payload.action,
                symbol: payload.symbol,
                orderQty: payload.orderQty,
                orderType: payload.orderType,
                price: payload.price,
                stopPrice: payload.stopPrice,
                isAutomated: true,
            });

            logger.info({ res: res.data }, 'Order placed successfully');
            return res.data;
        } catch (err: any) {
            logger.error({ err: err.response?.data || err.message }, 'Error placing order');
            throw err;
        }
    }

    /**
     * Cancels a pending order
     */
    static async cancelOrder(systemAccountId: string, orderId: number) {
        try {
            const client = await this._client(systemAccountId);
            const res = await client.post('/order/cancelorder', {
                orderId
            });
            return res.data;
        } catch (err: any) {
            logger.error('Error canceling order', err.response?.data || err.message);
            throw err;
        }
    }
}
