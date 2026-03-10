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
        const activeAccounts = await prisma.account.findMany({ where: { isActive: true } });
        logger.info(`Initializing WebSockets for ${activeAccounts.length} accounts`);

        for (const account of activeAccounts) {
            await this.connectSocket(account.id);
        }
    }

    /**
     * Connect and authorize a per-account Tradovate Socket session
     */
    async connectSocket(accountId: string) {
        if (this.sockets.has(accountId)) {
            this.sockets.get(accountId)?.close();
        }

        const account = await prisma.account.findUnique({ where: { id: accountId } });
        if (!account) return;

        try {
            const token = await TradovateAuthService.getAccessToken(accountId);
            const wsUrl = account.type === AccountType.LIVE ? config.TRADOVATE_WS_URL_LIVE : config.TRADOVATE_WS_URL_DEMO;

            const ws = new WebSocket(wsUrl);

            ws.on('open', () => {
                logger.info(`Tradovate WebSocket connected for account: ${account.accountSpec}`);

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
                            this.handleEventResponse(accountId, p);
                        }
                    } catch (e: any) {
                        logger.error(e, `Error parsing WS data for account ${accountId}`);
                    }
                }
            });

            ws.on('close', () => {
                logger.warn(`WebSocket closed for ${account.accountSpec}. Reconnecting in 5s...`);
                setTimeout(() => this.connectSocket(accountId), 5000); // Reconnection hook
            });

            ws.on('error', (err) => {
                logger.error(err, `WebSocket error for ${account.accountSpec}:`);
            });

            this.sockets.set(accountId, ws);
        } catch (error) {
            logger.error(`Failed to authorize Tradovate WS for account ${accountId}`);
        }
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
