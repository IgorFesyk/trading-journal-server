import { ROLE } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';

type User = {
    id: number;
    name: string;
    email: string;
    role: ROLE;
    createdAt: Date;
};

const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
} as const;

export const userService = {
    async findById(id: number): Promise<User | null> {
        return await prisma.user.findUnique({
            where: { id },
            select: userSelect,
        });
    },

    async findAll(role?: ROLE): Promise<User[]> {
        return await prisma.user.findMany({
            where: role ? { role } : undefined,
            select: userSelect,
            orderBy: { createdAt: 'asc' },
        });
    },

    async updateRole(id: number, role: ROLE): Promise<User> {
        return await prisma.user.update({
            where: { id },
            data: { role },
            select: userSelect,
        });
    },
};
