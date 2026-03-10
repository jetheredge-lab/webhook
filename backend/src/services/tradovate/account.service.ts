import axios from 'axios';
import { TradovateAuthService } from './auth.service';
import { PrismaClient, AccountType } from '@prisma/client';
import { config } from '../../config';

const prisma = new PrismaClient();

export class TradovateAccountService {
    /**
     * Internal common method to build an Axios client pre-authorized
     */
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
            },
        });
    }

    /**
     * Fetches the current positions for a Tradovate account
     */
    static async getPositions(systemAccountId: string) {
        const client = await this._client(systemAccountId);
        const res = await client.get('/position/list');
        return res.data;
    }

    /**
     * Subscribes to the live fills from a Tradovate account
     */
    static async getFills(systemAccountId: string) {
        const client = await this._client(systemAccountId);
        const res = await client.get('/fill/list');
        return res.data;
    }

    /**
     * Synchronizes Tradovate data with local representation if required.
     */
    static async getAccounts(systemAccountId: string) {
        const client = await this._client(systemAccountId);
        const res = await client.get('/account/list');
        return res.data; // List of tradovate internal accounts
    }
}
