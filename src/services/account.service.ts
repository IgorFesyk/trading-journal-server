import { Prisma } from '../generated/prisma/client';
import { CURRENCY } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

type CreateAccountInput = {
    userId: number;
    name: string;
    currency: CURRENCY;
    startingEquity: number;
};

type UpdateAccountInput = Partial<Omit<CreateAccountInput, 'userId'>>;

type AccountStats = {
    totalTrades: number;
    totalPnl: number;
    totalWinPnl: number;
    totalLosePnl: number;
    avgWinPnl: number | null;
    avgLosePnl: number | null;
    wins: number;
    losses: number;
    breakevens: number;
    inProgress: number;
};

export const accountService = {
    create(data: CreateAccountInput) {
        return prisma.account.create({ data });
    },

    findById(id: number, userId: number) {
        return prisma.account.findUnique({
            where: { id, userId },
        });
    },

    findByUserId(userId: number) {
        return prisma.account.findMany({
            where: { userId },
        });
    },

    update(accountId: number, userId: number, data: UpdateAccountInput) {
        return prisma.account.update({
            where: { id: accountId, userId },
            data,
        });
    },

    async getAccountStats(accountId: number, userId: number) {
        const account = await prisma.account.findUnique({ where: { id: accountId, userId: userId } });
        if (!account) return null;

        const [tradeStats] = await prisma.$queryRaw<[AccountStats]>(Prisma.sql`
            SELECT
                COUNT(*)::int                                                   AS "totalTrades",
                COALESCE(SUM(pnl), 0)::int                                      AS "totalPnl",
                COALESCE(SUM(pnl) FILTER (WHERE status = 'win'), 0)::int        AS "totalWinPnl",
                COALESCE(SUM(pnl) FILTER (WHERE status = 'lose'), 0)::int       AS "totalLosePnl",
                ROUND(AVG(pnl) FILTER (WHERE status = 'win'))::int              AS "avgWinPnl",
                ROUND(AVG(pnl) FILTER (WHERE status = 'lose'))::int             AS "avgLosePnl",
                COUNT(*) FILTER (WHERE status = 'win')::int                     AS "wins",
                COUNT(*) FILTER (WHERE status = 'lose')::int                    AS "losses",
                COUNT(*) FILTER (WHERE status = 'be')::int                      AS "breakevens",
                COUNT(*) FILTER (WHERE status = 'in-progress')::int             AS "inProgress"
            FROM trades
            WHERE account_id = ${account.id}
        `);

        return {
            name: account.name,
            startingEquity: account.startingEquity,
            currency: account.currency,
            ...tradeStats,
        };
    },

    delete(accountId: number, userId: number) {
        return prisma.account.delete({
            where: { id: accountId, userId },
        });
    },
};
