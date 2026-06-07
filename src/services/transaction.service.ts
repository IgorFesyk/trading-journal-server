import { TRANSACTION_TYPE } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';
import { ApiError } from '../libs/api-error';

type CreateTransactionInput = {
    accountId: number;
    type: TRANSACTION_TYPE;
    amount: number;
    occurredAt: Date;
    note?: string;
};

type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, 'accountId'>>;

export const transactionService = {
    async create(data: CreateTransactionInput, userId: number) {
        const account = await prisma.account.findFirst({ where: { id: data.accountId, userId } });
        if (!account) throw ApiError.NotFound('Account not found');
        return prisma.transaction.create({ data });
    },

    findByAccount(accountId: number, userId: number, filters?: { type?: TRANSACTION_TYPE }) {
        return prisma.transaction.findMany({
            where: {
                accountId,
                account: { userId },
                ...filters,
            },
            orderBy: { occurredAt: 'desc' },
        });
    },

    findById(id: number, accountId: number, userId: number) {
        return prisma.transaction.findFirst({
            where: { id, accountId, account: { userId } },
        });
    },

    update(id: number, accountId: number, userId: number, data: UpdateTransactionInput) {
        return prisma.transaction.updateMany({
            where: { id, accountId, account: { userId } },
            data,
        });
    },

    delete(id: number, accountId: number, userId: number) {
        return prisma.transaction.deleteMany({
            where: { id, accountId, account: { userId } },
        });
    },
};
