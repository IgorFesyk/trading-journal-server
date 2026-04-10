import bcrypt from 'bcrypt';

import { ApiError } from '../api-error';
import { prisma } from '../lib/prisma';
import { tokenService } from './token.service';

// TODO: Add OAuth

export const authService = {
    async signup(name: string, email: string, password: string) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw ApiError.BadRequest('User with this email already exists');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({ data: { name, email, password: passwordHash } });

        const tokens = tokenService.generateTokens({ id: user.id, email: user.email });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, name: user.name, email: user.email } };
    },

    async signin(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw ApiError.BadRequest('User with this email does not exist');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw ApiError.BadRequest('Incorrect password');
        }

        const tokens = tokenService.generateTokens({ id: user.id, email: user.email });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, name: user.name, email: user.email } };
    },

    async logout(refreshToken: string) {
        // TODO: Black list for tokens
        return tokenService.removeToken(refreshToken);
    },

    async refresh(refreshToken: string) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        if (!userData) {
            throw ApiError.UnauthorizedError();
        }

        const tokenFromDB = await tokenService.findToken(refreshToken);
        if (!tokenFromDB) {
            throw ApiError.UnauthorizedError();
        }

        const user = await prisma.user.findUnique({
            where: { id: userData.id },
            select: { id: true, name: true, email: true },
        });
        if (!user) throw ApiError.UnauthorizedError();

        const tokens = tokenService.generateTokens({ id: user.id, email: user.email });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user };
    },
};
