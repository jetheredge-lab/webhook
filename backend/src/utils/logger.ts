import Redis from 'ioredis';
import { config } from '../config';
import pino from 'pino';

export const logger = pino({
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
    transport:
        config.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: { colorize: true }
            }
            : undefined,
});

export const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
    logger.error(err, 'Redis connection error:');
});
