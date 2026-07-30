import { CATEGORY } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';
import { ApiError } from '../libs/api-error';

type CreateSymbolInput = {
    name: string;
    category: CATEGORY;
    published?: boolean;
};

type UpdateSymbolInput = {
    name?: string;
    category?: CATEGORY;
    published?: boolean;
};

type SymbolWithTradeCount = {
    id: number;
    name: string;
    category: CATEGORY;
    published: boolean;
    tradeCount: number;
};

export const symbolService = {
    async create(data: CreateSymbolInput) {
        const existing = await prisma.symbol.findUnique({ where: { name: data.name } });
        if (existing) {
            throw ApiError.BadRequest('A symbol with this name already exists');
        }

        return prisma.symbol.create({ data });
    },

    findById(id: number) {
        return prisma.symbol.findUnique({ where: { id } });
    },

    async findAll(category?: CATEGORY, published?: boolean): Promise<SymbolWithTradeCount[]> {
        const symbols = await prisma.symbol.findMany({
            where: {
                ...(category && { category }),
                ...(published !== undefined && { published }),
            },
            orderBy: { name: 'asc' },
            include: { _count: { select: { trades: true } } },
        });

        return symbols.map(({ _count, ...symbol }) => ({ ...symbol, tradeCount: _count.trades }));
    },

    update(id: number, data: UpdateSymbolInput) {
        return prisma.symbol.update({ where: { id }, data });
    },

    async delete(id: number) {
        const tradeCount = await prisma.trade.count({ where: { symbolId: id } });
        if (tradeCount > 0) {
            throw ApiError.BadRequest('Cannot delete a symbol that has trades');
        }

        return prisma.symbol.delete({ where: { id } });
    },
};
