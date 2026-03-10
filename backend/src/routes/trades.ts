import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function tradeRoutes(fastify: FastifyInstance) {
    // GET /api/trades
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // Mock Pagination query struct
            const { page = 1, limit = 50 } = request.query as any;
            const skip = (Number(page) - 1) * Number(limit);

            const trades = await prisma.trade.findMany({
                skip,
                take: Number(limit),
                orderBy: { entryTime: 'desc' },
                include: { account: { select: { accountSpec: true, name: true } } }
            });

            const total = await prisma.trade.count();

            return reply.send({
                success: true,
                data: trades,
                meta: { total, page: Number(page), limit: Number(limit) }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

    // GET /api/trades/filters
    fastify.get('/filters', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const accounts = await prisma.account.findMany({
                select: { id: true, name: true, accountSpec: true }
            });

            const strategies = await prisma.trade.findMany({
                select: { strategy: true },
                distinct: ['strategy']
            });

            return reply.send({
                success: true,
                accounts,
                strategies: strategies.map(s => s.strategy).filter(Boolean)
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

    // GET /api/trades/analytics
    fastify.get('/analytics', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { accountId, strategy } = request.query as any;

            const whereClause: any = {};
            if (accountId) whereClause.accountId = accountId;
            if (strategy) whereClause.strategy = strategy;

            const trades = await prisma.trade.findMany({
                where: whereClause,
                orderBy: { entryTime: 'asc' }
            });

            let totalProfit = 0;
            let totalLoss = 0;
            let winCount = 0;
            let maxDrawdown = 0;

            const dailyMap: Record<string, number> = {};
            let cumulativePnl = 0;
            let peak = 0;

            for (const t of trades) {
                const pnl = t.netPnl || t.grossPnl || 0;
                const d = new Date(t.entryTime).toISOString().split('T')[0];
                dailyMap[d] = (dailyMap[d] || 0) + pnl;

                if (pnl > 0) {
                    totalProfit += pnl;
                    winCount++;
                } else {
                    totalLoss += Math.abs(pnl);
                }

                cumulativePnl += pnl;
                if (cumulativePnl > peak) peak = cumulativePnl;

                const drawdown = peak - cumulativePnl;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }

            const winRate = trades.length ? (winCount / trades.length) * 100 : 0;
            const profitFactor = totalLoss === 0 ? (totalProfit > 0 ? 999 : 0) : (totalProfit / totalLoss);

            const series = Object.entries(dailyMap).map(([day, pnl]) => ({ day, pnl }));
            series.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

            // Convert raw daily PNL to cumulative PNL for the chart mapping
            let rollingSum = 0;
            const cumulativeSeries = series.map(s => {
                rollingSum += s.pnl;
                return { day: s.day, pnl: rollingSum };
            });

            return reply.send({
                success: true,
                stats: {
                    winRate: winRate.toFixed(2),
                    profitFactor: profitFactor.toFixed(2),
                    totalTrades: trades.length,
                    netPnl: cumulativePnl.toFixed(2),
                    maxDrawdown: maxDrawdown.toFixed(2)
                },
                series: cumulativeSeries
            });

        } catch (e: any) {
            return reply.status(500).send({ success: false, error: e.message });
        }
    });

}
