import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { env } from '../env';
import { ROLE } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

const tokenPayloadSchema = z.object({
    id: z.number(),
    email: z.email(),
    name: z.string(),
    role: z.enum(ROLE),
});

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export const tokenService = {
    generateTokens(payload: TokenPayload) {
        const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        return { accessToken, refreshToken };
    },

    // TODO: support multiple tokens per user?
    async saveToken(userId: number, refreshToken: string) {
        const tokenHash = await bcrypt.hash(refreshToken, 12);
        return await prisma.token.upsert({
            where: { userId },
            update: { refreshToken: tokenHash },
            create: { userId, refreshToken: tokenHash },
        });
    },

    async removeToken(userId: number) {
        return await prisma.token.deleteMany({ where: { userId } });
    },

    async checkToken(userId: number, rawToken: string): Promise<boolean> {
        const stored = await prisma.token.findUnique({ where: { userId } });
        if (!stored) return false;

        return bcrypt.compare(rawToken, stored.refreshToken);
    },

    validateAccessToken(token: string): TokenPayload | null {
        try {
            const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
            return tokenPayloadSchema.parse(payload);
        } catch {
            return null;
        }
    },

    validateRefreshToken(token: string): TokenPayload | null {
        try {
            const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
            return tokenPayloadSchema.parse(payload);
        } catch {
            return null;
        }
    },
};
