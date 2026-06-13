import { ACCOUNT_TYPE, CURRENCY } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

type CreateAccountInput = {
    userId: number;
    name: string;
    type: ACCOUNT_TYPE;
    currency: CURRENCY;
    startingEquity: number;
    targetEquity?: number;
};

type UpdateAccountInput = Partial<Omit<CreateAccountInput, 'userId'>>;

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

    delete(accountId: number, userId: number) {
        return prisma.account.delete({
            where: { id: accountId, userId },
        });
    },
};
