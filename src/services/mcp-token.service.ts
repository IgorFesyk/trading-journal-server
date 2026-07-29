import crypto from 'crypto';

import { prisma } from '../infra/prisma';

function hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export const mcpTokenService = {
    async hasToken(userId: number): Promise<boolean> {
        const record = await prisma.mcpToken.findUnique({ where: { userId }, select: { userId: true } });
        return !!record;
    },

    async generateToken(userId: number): Promise<string> {
        const rawToken = `mcp_${crypto.randomBytes(32).toString('base64url')}`;
        const tokenHash = hashToken(rawToken);

        await prisma.mcpToken.upsert({
            where: { userId },
            update: { tokenHash },
            create: { userId, tokenHash },
        });

        return rawToken;
    },

    async revokeToken(userId: number) {
        return await prisma.mcpToken.deleteMany({ where: { userId } });
    },

    async validateToken(rawToken: string) {
        const tokenHash = hashToken(rawToken);
        const record = await prisma.mcpToken.findUnique({
            where: { tokenHash },
            include: { user: { select: { id: true, email: true, name: true, role: true } } },
        });
        if (!record) return null;

        await prisma.mcpToken.update({
            where: { userId: record.userId },
            data: { lastUsedAt: new Date() },
        });

        return record.user;
    },
};
