import { Direction, Timeframe, TradeResult, TradeStyle } from '../generated/prisma/enums';
import { prisma } from '../lib/prisma';

type CreateTradeData = {
    pairId: number;
    entryPrice: number;
    exitPrice: number;
    stopLoss: number;
    takeProfit: number;
    pnl: number;
    riskPercent: number;
    rr: number;
    lotSize: number;
    result: TradeResult;
    direction: Direction;
    entryTF: Timeframe;
    tradeStyle: TradeStyle;
    notes?: string;
    openedAt: Date;
    closedAt?: Date;
};

type UpdateTradeData = Partial<CreateTradeData>;

export const tradeService = {
    create(accountId: number, data: CreateTradeData) {
        return prisma.trade.create({
            data: { accountId, ...data },
        });
    },

    findById(id: number) {
        return prisma.trade.findUnique({
            where: { id },
            include: { pair: true, images: true },
        });
    },

    findByAccountId(accountId: number) {
        return prisma.trade.findMany({
            where: { accountId },
            include: { pair: true },
            orderBy: { openedAt: 'desc' },
        });
    },

    update(id: number, data: UpdateTradeData) {
        return prisma.trade.update({
            where: { id },
            data,
        });
    },

    delete(id: number) {
        return prisma.trade.delete({
            where: { id },
        });
    },
};
