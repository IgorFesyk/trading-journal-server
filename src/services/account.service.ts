import { AccountType, Currency } from '../generated/prisma/enums';
import { prisma } from '../lib/prisma';

interface CreateAccountData {
    name: string;
    type: AccountType;
    startingEquity: number;
    targetEquity: number;
    currency: Currency;
}

interface UpdateAccountData {
    name?: string;
    targetEquity?: number;
}

export const accountService = {
    create(userId: number, data: CreateAccountData) {
        return prisma.account.create({
            data: { userId, ...data },
        });
    },

    findById(id: number) {
        return prisma.account.findUnique({
            where: { id },
        });
    },

    findByUserId(userId: number) {
        return prisma.account.findMany({
            where: { userId },
        });
    },

    update(id: number, data: UpdateAccountData) {
        return prisma.account.update({
            where: { id },
            data,
        });
    },

    delete(id: number) {
        return prisma.account.delete({
            where: { id },
        });
    },

    async getCurrentEquity(id: number) {
        const account = await prisma.account.findUnique({
            where: { id },
            select: { startingEquity: true },
        });

        if (!account) return null;

        const result = await prisma.trade.aggregate({
            where: { accountId: id },
            // TODO: check if there is floating issue
            _sum: { pnl: true },
        });

        const totalPnl = result._sum.pnl ?? 0;
        return Number(account.startingEquity) + Number(totalPnl);
    },
};
