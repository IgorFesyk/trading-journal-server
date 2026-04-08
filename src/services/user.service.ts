import { prisma } from '../lib/prisma';

export const userService = {
    create(name: string, email: string, password: string) {
        return prisma.user.create({
            data: { name, email, password },
        });
    },

    findById(id: number) {
        return prisma.user.findUnique({
            where: { id },
        });
    },

    findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    delete(id: number) {
        return prisma.user.delete({
            where: { id },
        });
    },
};
