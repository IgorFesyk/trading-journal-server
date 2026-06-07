import { DIRECTION, EXECUTION_SETUP, TIMEFRAME, TRADE_STATUS } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';
import { ApiError } from '../libs/api-error';

type CreateTradeInput = {
    accountId: number;
    symbolId: number;
    risk: number;
    direction: DIRECTION;
    entryTF: TIMEFRAME;
    setup: EXECUTION_SETUP;
    openedAt: Date;
    status: TRADE_STATUS;
    pnl?: number;
    commission: number;
    notes?: string;
    closedAt?: Date;
};

type UpdateTradeInput = Partial<Omit<CreateTradeInput, 'accountId'>>;

export const tradeService = {
    async create(data: CreateTradeInput, userId: number) {
        const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
        if (!account) throw ApiError.NotFound('Account not found');
        return prisma.trade.create({ data });
    },

    findByAccount(accountId: number, userId: number, filters?: { status?: TRADE_STATUS; direction?: DIRECTION }) {
        return prisma.trade.findMany({
            where: {
                accountId,
                account: { userId },
                ...filters,
            },
            orderBy: { openedAt: 'desc' },
        });
    },

    findById(id: number, accountId: number, userId: number) {
        return prisma.trade.findFirst({
            where: { id, accountId, account: { userId } },
        });
    },

    update(id: number, accountId: number, userId: number, data: UpdateTradeInput) {
        return prisma.trade.updateMany({
            where: { id, accountId, account: { userId } },
            data,
        });
    },

    delete(id: number, accountId: number, userId: number) {
        return prisma.trade.deleteMany({
            where: { id, accountId, account: { userId } },
        });
    },
};
