import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface TokenPayload {
    id: number;
    email: string;
}

export const tokenService = {
    generateTokens(payload: TokenPayload) {
        const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '1d' });
        return { accessToken, refreshToken };
    },

    async saveToken(userId: number, refreshToken: string) {
        const existing = await prisma.token.findFirst({ where: { userId } });

        if (existing) {
            return prisma.token.update({ where: { userId }, data: { refreshToken } });
        }

        return prisma.token.create({ data: { userId, refreshToken } });
    },

    async removeToken(refreshToken: string) {
        return prisma.token.delete({ where: { refreshToken } });
    },

    async findToken(refreshToken: string) {
        return prisma.token.findFirst({ where: { refreshToken } });
    },

    validateAccessToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
        } catch {
            return null;
        }
    },

    validateRefreshToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
        } catch {
            return null;
        }
    },
};
