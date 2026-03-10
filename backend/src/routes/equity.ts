import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function equityRoutes(fastify: FastifyInstance) {
    // GET /api/equity/:accountId/calendar
    fastify.get('/:accountId/calendar', async (request: FastifyRequest<{ Params: { accountId: string } }>, reply: FastifyReply) => {
        try {
            const { accountId } = request.params;
            const snapshots = await prisma.equitySnapshot.findMany({
                where: { accountId },
                orderBy: { date: 'asc' }
            });

            return reply.send({ success: true, data: snapshots });
        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });
}
