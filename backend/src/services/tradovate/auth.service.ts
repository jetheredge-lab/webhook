import axios from 'axios';
import { redis, logger } from '../../utils/logger';
import { config } from '../../config';
import cron from 'node-cron';

// Mock DB import since Prisma client depends on generate
import { PrismaClient, AccountType } from '@prisma/client';
const prisma = new PrismaClient();

const getTokenKey = (accountId: string) => `tradovate:token:${accountId}`;

export class TradovateAuthService {
    /**
     * Fetch Access Token for a specific account using REST API.
     * If cached in Redis, return it to save an API call.
     */
    static async getAccessToken(accountId: string, forceRefresh = false): Promise<string> {
        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) throw new Error('Account not found in DB');

        if (!forceRefresh) {
            const cachedToken = await redis.get(getTokenKey(accountId));
            if (cachedToken) {
                return cachedToken;
            }
        }

        const apiUrl =
            account.type === AccountType.LIVE ? config.TRADOVATE_API_URL_LIVE : config.TRADOVATE_API_URL_DEMO;

        try {
            // Assuming decrypted API keys. AES decryption would go here.
            // For simplicity here, we assume the apiKey/Secret are raw (placeholder logic).
            const decryptedSecret = account.apiSecret; // TODO: aes decrypt

            const response = await axios.post(`${apiUrl}/auth/accesstokenrequest`, {
                name: account.apiKey,
                password: decryptedSecret,
                appId: 'SampleApp',
                appVersion: '1.0',
                cid: account.cid || 0,
                sec: account.sec || 'change_me'
            });

            const token = response.data.accessToken;

            // Cache token in redis with expiry (Tokens expire after ~1h 20m. We set TTL inside loop)
            await redis.set(getTokenKey(accountId), token, 'EX', 60 * 60);

            logger.info(`Successfully fetched Tradovate access token for account ${account.accountSpec}`);
            return token;
        } catch (error: any) {
            logger.error(error.response?.data || error, 'Failed fetching Tradovate access token:');
            throw error;
        }
    }

    /**
     * Cron job to refresh tokens every 70 minutes.
     */
    static startTokenRefreshCron() {
        // Run every 70 minutes (or realistically hourly using cron string '0 * * * *')
        cron.schedule('0 * * * *', async () => {
            logger.info('Running Tradovate Token Refresh Cron Job...');
            try {
                const activeAccounts = await prisma.account.findMany({ where: { isActive: true } });
                for (const account of activeAccounts) {
                    try {
                        await this.getAccessToken(account.id, true);
                    } catch (e) {
                        logger.error(`Failed refreshing token for ${account.accountSpec}`);
                    }
                }
            } catch (e) {
                logger.error('Failed to run token refresh query');
            }
        });
    }

    /**
     * Test credentials and return available accounts
     */
    static async testCredentials(name: string, password: string, isDemo: boolean, cid?: number, sec?: string): Promise<any[]> {
        const apiUrl = isDemo ? config.TRADOVATE_API_URL_DEMO : config.TRADOVATE_API_URL_LIVE;
        try {
            const authRes = await axios.post(`${apiUrl}/auth/accesstokenrequest`, {
                name,
                password,
                appId: 'SampleApp',
                appVersion: '1.0',
                cid: cid || 0,
                sec: sec || 'change_me'
            });

            const token = authRes.data.accessToken;

            // Fetch accounts list to verify and show to user
            const syncRes = await axios.post(`${apiUrl}/user/syncrequest`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return syncRes.data.accounts || [];

        } catch (error: any) {
            logger.error(error.response?.data || error, 'Credential test failed:');
            throw error;
        }
    }
}
