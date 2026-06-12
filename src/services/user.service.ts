import { prisma } from '../infra/prisma';

type User = {
    id: number;
    name: string;
    email: string;
};

export const userService = {
    async findById(id: number): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
    },
};
