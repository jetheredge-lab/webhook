import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export default async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { username, password } = request.body as Record<string, any>;

            // Check if there are ANY users in the database
            const userCount = await prisma.user.count();

            if (userCount === 0) {
                // Initial bootstrap logic from .env credentials
                if (username === config.DASHBOARD_USERNAME && password === config.DASHBOARD_PASSWORD) {
                    const hashedPassword = await bcrypt.hash(password, 10);

                    const newAdmin = await prisma.user.create({
                        data: {
                            username: config.DASHBOARD_USERNAME,
                            password: hashedPassword,
                            role: UserRole.ADMIN
                        }
                    });

                    logger.info('Initialized default admin user from ENV parameters');
                    const token = fastify.jwt.sign({ id: newAdmin.id, username: newAdmin.username, role: newAdmin.role });
                    return reply.send({ success: true, token, user: { username: newAdmin.username, role: newAdmin.role } });
                } else {
                    return reply.status(401).send({ success: false, error: 'Invalid credentials' });
                }
            }

            // Normal authentication flow via database
            const user = await prisma.user.findUnique({
                where: { username }
            });

            if (!user) {
                return reply.status(401).send({ success: false, error: 'Invalid credentials' });
            }

            const isValid = await bcrypt.compare(password, user.password);

            if (isValid) {
                const token = fastify.jwt.sign({ id: user.id, username: user.username, role: user.role });
                return reply.send({ success: true, token, user: { username: user.username, role: user.role } });
            }

            return reply.status(401).send({ success: false, error: 'Invalid credentials' });
        } catch (error) {
            logger.error(error, 'Login fail:');
            return reply.status(500).send({ success: false, error: 'Internal Server Error' });
        }
    });

    fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            const { id } = request.user as { id: string };

            const user = await prisma.user.findUnique({ where: { id } });
            if (!user) return reply.status(404).send({ error: 'User not found' });

            return reply.send({ success: true, user: { username: user.username, role: user.role } });
        } catch (err) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // Provide the Webhook Secret to Authenticated Users
    fastify.get('/webhook-secret', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            return reply.send({ success: true, secret: config.WEBHOOK_SECRET });
        } catch (err) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });
}
