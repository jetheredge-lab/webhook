import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export default async function accountRoutes(fastify: FastifyInstance) {
    // GET /api/accounts
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const accounts = await prisma.account.findMany({
                select: {
                    id: true,
                    tradovateAccountId: true,
                    accountSpec: true,
                    name: true,
                    type: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                }
            });
            return reply.send({ success: true, data: accounts });
        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

    // POST /api/accounts
    fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = request.body as any;
            const account = await prisma.account.create({
                data: {
                    tradovateAccountId: body.tradovateAccountId,
                    accountSpec: body.accountSpec,
                    name: body.name || body.accountSpec,
                    type: body.type || 'DEMO',
                    apiKey: body.apiKey,
                    apiSecret: body.apiSecret, // In production, encrypt this
                    isActive: true
                }
            });
            return reply.send({ success: true, data: account });
        } catch (e: any) {
            logger.error(e, 'Failed to create account');
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

    // DELETE /api/accounts/:id
    fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            await prisma.account.delete({ where: { id } });
            return reply.send({ success: true });
        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

    // POST /api/accounts/:id/test
    fastify.post('/:id/test', async (request: FastifyRequest, reply: FastifyReply) => {
        const { id } = request.params as { id: string };
        const { TradovateAuthService } = await import('../services/tradovate/auth.service');
        try {
            await TradovateAuthService.getAccessToken(id, true); // Force refresh to test keys
            return reply.send({ success: true, message: 'Connection Successful!' });
        } catch (e: any) {
            return reply.status(401).send({
                success: false,
                message: 'Authentication Failed. Check your API Key (Name) and Secret (Password).',
                details: e.response?.data || e.message
            });
        }
    });

    // POST /api/accounts/test-credentials
    fastify.post('/test-credentials', async (request: FastifyRequest, reply: FastifyReply) => {
        const { TradovateAuthService } = await import('../services/tradovate/auth.service');
        const body = request.body as any;
        try {
            const isDemo = body.type !== 'LIVE';
            const accounts = await TradovateAuthService.testCredentials(body.apiKey, body.apiSecret, isDemo);
            return reply.send({ success: true, message: 'Credentials Verified!', data: accounts });
        } catch (e: any) {
            return reply.status(401).send({
                success: false,
                message: 'Invalid Credentials',
                details: e.response?.data || e.message
            });
        }
    });
}
