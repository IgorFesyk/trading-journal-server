import { CATEGORY } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

type CreateSymbolInput = {
    name: string;
    category: CATEGORY;
};

type UpdateSymbolInput = {
    name?: string;
    category?: CATEGORY;
};

export const symbolService = {
    create(data: CreateSymbolInput) {
        return prisma.symbol.create({ data });
    },

    findById(id: number) {
        return prisma.symbol.findUnique({ where: { id } });
    },

    findAll(category?: CATEGORY) {
        return prisma.symbol.findMany({
            where: category ? { category } : undefined,
            orderBy: { name: 'asc' },
        });
    },

    update(id: number, data: UpdateSymbolInput) {
        return prisma.symbol.update({ where: { id }, data });
    },

    delete(id: number) {
        return prisma.symbol.delete({ where: { id } });
    },
};
