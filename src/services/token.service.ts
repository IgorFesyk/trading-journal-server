import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { prisma } from '../infra/prisma';
import { env } from '../env';
import { ROLE } from '../generated/prisma/enums';

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
        return await prisma.token.upsert({
            where: { userId },
            update: { refreshToken },
            create: {
                userId,
                refreshToken,
            },
        });
    },

    // TODO: what if not exists in the DB?
    async removeToken(refreshToken: string) {
        return await prisma.token.delete({ where: { refreshToken } });
    },

    async findToken(refreshToken: string) {
        return await prisma.token.findUnique({ where: { refreshToken } });
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
