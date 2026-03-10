import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export default async function userRoutes(fastify: FastifyInstance) {
    // Middleware to ensure ADMIN role across these endpoints
    fastify.addHook('preValidation', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await request.jwtVerify();
            const { role } = request.user as { role: UserRole };
            if (role !== UserRole.ADMIN) {
                return reply.status(403).send({ error: 'Forbidden: Admins Only' });
            }
        } catch (e) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    });

    // List all users
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    role: true,
                    createdAt: true
                }
            });
            return reply.send({ users });
        } catch (error) {
            logger.error(error, 'Fetch users fail:');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create new user (or admin)
    fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { username, password, role } = request.body as Record<string, string>;

            if (!username || !password) {
                return reply.status(400).send({ error: 'Username and password required' });
            }

            const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser) {
                return reply.status(400).send({ error: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role: (role as UserRole) || UserRole.USER
                },
                select: { id: true, username: true, role: true }
            });

            return reply.send({ success: true, user: newUser });
        } catch (error) {
            logger.error(error, 'Create user fail:');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Reset User Password
    fastify.put('/:id/reset-password', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const { newPassword } = request.body as Record<string, string>;

            if (!newPassword) return reply.status(400).send({ error: 'New password required' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            await prisma.user.update({
                where: { id },
                data: { password: hashedPassword }
            });

            return reply.send({ success: true, message: 'Password reset successful' });
        } catch (error) {
            logger.error(error, 'Reset password fail:');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete User
    fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { id } = request.params as { id: string };
            const currentUser = request.user as { id: string };

            if (id === currentUser.id) {
                return reply.status(400).send({ error: 'Cannot delete your own admin account' });
            }

            await prisma.user.delete({ where: { id } });
            return reply.send({ success: true, message: 'User deleted' });
        } catch (error) {
            logger.error(error, 'Delete user fail:');
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
