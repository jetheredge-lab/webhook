import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

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

    // Basic CRUD placeholders for expansion
}
