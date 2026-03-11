import WebSocket from 'ws';
import { logger } from '../../utils/logger';
import { TradovateAuthService } from './auth.service';
import { PrismaClient, AccountType } from '@prisma/client';
import { config } from '../../config';

const prisma = new PrismaClient();

export class TradovateSocketService {
    private sockets: Map<string, WebSocket> = new Map();

    /**
     * Initializes WebSocket connections across all active stored accounts
     */
    async initializeAllSockets() {
        try {
            const activeAccounts = await prisma.account.findMany({ where: { isActive: true } });
            logger.info(`Initializing WebSockets for ${activeAccounts.length} accounts`);

            for (const account of activeAccounts) {
                await this.connectSocket(account.id);
            }
        } catch (error: any) {
            if (error.code === 'P2021' || error.message?.includes('does not exist')) {
                logger.warn('Skipping Socket initialization: Database not migrated yet.');
                return;
            }
            logger.error(error, `Socket Initialization failed.`);
            throw error;
        }
    }

    private retryCounts: Map<string, number> = new Map();

    /**
     * Connect and authorize a per-account Tradovate Socket session
     */
    async asyncConnectSocket(accountId: string) {
        if (this.sockets.has(accountId)) {
            const oldWs = this.sockets.get(accountId);
            if (oldWs?.readyState !== WebSocket.CLOSED) {
                oldWs?.close();
            }
            this.sockets.delete(accountId);
        }

        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) return;

        try {
            const token = await TradovateAuthService.getAccessToken(accountId);
            const wsUrl = account.type === AccountType.LIVE ? config.TRADOVATE_WS_URL_LIVE : config.TRADOVATE_WS_URL_DEMO;

            const ws = new WebSocket(wsUrl);
            this.sockets.set(accountId, ws);

            ws.on('open', () => {
                logger.info(`Tradovate WebSocket connected for account: ${account.accountSpec}`);
                this.retryCounts.set(accountId, 0); // Reset on success

                // Authorization message payload
                const authPayload = `authorize\n1\n\n${token}`;
                ws.send(authPayload);
            });

            ws.on('message', (data: WebSocket.Data) => {
                const msg = data.toString();
                // A heartbeat comes down as `h`, the API specifies we emit `[]` instantly
                if (msg === 'h' || msg === 'c') return ws.send('[]');

                // Handling parsed responses
                if (msg.startsWith('a')) {
                    const payloadString = msg.slice(1);
                    try {
                        const payloads = JSON.parse(payloadString);
                        for (const p of payloads) {
                            if (p.s === 401) {
                                logger.error(`Socket Auth Rejected for ${account.accountSpec}: ${JSON.stringify(p.d)}`);
                                ws.close();
                                return;
                            }
                            this.handleEventResponse(accountId, p);
                        }
                    } catch (e: any) {
                        logger.error(e, `Error parsing WS data for account ${accountId}`);
                    }
                }
            });

            ws.on('close', (code, reason) => {
                const currentRetry = this.retryCounts.get(accountId) || 0;
                // Avoid retrying if it's a permanent auth failure or if we've crashed too many times
                if (currentRetry > 10) {
                    logger.error(`Stopping Socket retries for ${account.accountSpec} after 10 attempts.`);
                    return;
                }

                const delay = Math.min(1000 * Math.pow(2, currentRetry), 300000); // Max 5 mins
                logger.warn(`WebSocket closed for ${account.accountSpec} (Code: ${code}). Retrying in ${delay / 1000}s...`);

                this.retryCounts.set(accountId, currentRetry + 1);
                setTimeout(() => this.asyncConnectSocket(accountId), delay);
            });

            ws.on('error', (err: any) => {
                // 429 or connection errors land here
                logger.error({ err: err.message || err }, `WebSocket error for ${account.accountSpec}:`);
            });

        } catch (error: any) {
            const status = error.response?.status;
            logger.error(`Failed to authorize Tradovate WS for account ${accountId}: ${error.message}`);

            // If it's a 401, don't immediately retry every 5s, it's a credential issue
            if (status !== 401) {
                const currentRetry = this.retryCounts.get(accountId) || 0;
                const delay = Math.min(1000 * Math.pow(2, currentRetry), 60000);
                this.retryCounts.set(accountId, currentRetry + 1);
                setTimeout(() => this.asyncConnectSocket(accountId), delay);
            }
        }
    }

    // Wrap to match original interface
    async connectSocket(accountId: string) {
        return this.asyncConnectSocket(accountId);
    }

    handleEventResponse(accountId: string, eventObj: any) {
        if (eventObj.e === 'props') {
            logger.debug(`Props payload received for account ${accountId}:`, eventObj.d);

            const entityType = eventObj.d.entityType;
            const entity = eventObj.d.entity;

            // If we receive an 'Order' push message:
            if (entityType === 'order') {
                const orderStatus = entity.ordStatus; // values: 'Pending', 'Filled', 'Working', 'Rejected', 'Canceled'
                logger.info(`Tradovate Order Sync [${accountId}]: Status ${orderStatus}`);

                // Example: Track order state changes and emit to Socket.io to refresh user dashboard
                // If Filled -> Wait for Fill emission or immediately fire OCO/Bracket REST logic via Queue
            }
        }
    }
}

export const socketService = new TradovateSocketService();
