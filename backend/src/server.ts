import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import { Server } from 'socket.io';
import { config } from './config';
import { logger } from './utils/logger';

// Providers and cron/worker integrations
import { TradovateAuthService } from './services/tradovate/auth.service';
import { socketService } from './services/tradovate/socket.service';
import { initOrderWorker } from './workers/order.worker';

// REST Routes
import webhookRoutes from './routes/webhook';
import accountRoutes from './routes/accounts';
import tradeRoutes from './routes/trades';
import equityRoutes from './routes/equity';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';

const buildServer = () => {
    const app = fastify({ logger: false });

    app.register(cors, { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] });
    app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
            },
        },
    });

    // Attach health check
    app.get('/health', async () => ({ status: 'ok', time: new Date() }));

    // JWT Registration
    app.register(fastifyJwt, { secret: config.APP_SECRET });

    // Global Auth Hook masking `/api/*`
    app.addHook('onRequest', async (request, reply) => {
        const url = request.url;
        // Skip webhooks, health, and auth login
        if (!url.startsWith('/api') || url.startsWith('/api/auth')) return;
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Register modular business logic routes
    app.register(authRoutes, { prefix: '/api/auth' });
    app.register(userRoutes, { prefix: '/api/users' });
    app.register(webhookRoutes, { prefix: '/api/webhook' });
    app.register(accountRoutes, { prefix: '/api/accounts' });
    app.register(tradeRoutes, { prefix: '/api/trades' });
    app.register(equityRoutes, { prefix: '/api/equity' });

    return app;
};

const start = async () => {
    const app = buildServer();
    let worker: ReturnType<typeof initOrderWorker> | null = null;
    let io: Server | null = null;

    try {
        const port = Number(config.APP_PORT) || 3001;
        await app.listen({ port, host: '0.0.0.0' });

        // Attach Socket.io server to the existing fastify http instance
        io = new Server(app.server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
        });

        io.on('connection', (socket) => {
            logger.info(`Socket.io Client Connected ID: ${socket.id}`);
            socket.on('disconnect', () => logger.info(`Socket.io Client Disconnected ID: ${socket.id}`));
        });

        logger.info(`Tradovate Bridge Backend listening securely on port ${port}`);

        // Post-startup Hooks
        const runStartupHooks = async (retries = 5) => {
            try {
                TradovateAuthService.startTokenRefreshCron();
                await socketService.initializeAllSockets();
                worker = initOrderWorker();
                logger.info('Order Execution worker online');
            } catch (startupErr: any) {
                if (retries > 0) {
                    logger.warn(`Startup hooks failed (${startupErr.message}). Retrying in 5s... (${retries} retries left)`);
                    setTimeout(() => runStartupHooks(retries - 1), 5000);
                } else {
                    logger.error(startupErr, 'Fatal startup hook failure after retries.');
                }
            }
        };

        runStartupHooks();

    } catch (err) {
        logger.error(err, 'Fatal initialization error:');
        process.exit(1);
    }

    // Graceful shutdown
    const closeSignals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    for (const signal of closeSignals) {
        process.on(signal, async () => {
            logger.info(`Received ${signal}. Gracefully shutting down...`);
            if (worker) await worker.close();
            if (io) io.close();
            await app.close();
            process.exit(0);
        });
    }
};

start();
