import { ACCOUNT_TYPE, CURRENCY } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

type AccountSummary = {
    id: number;
    name: string;
    type: ACCOUNT_TYPE;
    currency: CURRENCY;
};

type UserWithAccounts = {
    id: number;
    name: string;
    email: string;
    accounts: AccountSummary[];
};

export const userService = {
    async findById(id: number): Promise<UserWithAccounts | null> {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                accounts: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        currency: true,
                    },
                },
            },
        });
    },
};
