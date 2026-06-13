import bcrypt from 'bcrypt';

import { prisma } from '../infra/prisma';
import { ApiError } from '../libs/api-error';
import { tokenService } from './token.service';

type User = {
    id: number;
    email: string;
    name: string;
};

type Tokens = {
    accessToken: string;
    refreshToken: string;
};

type AuthResult = {
    tokens: Tokens;
    user: User;
};

export const authService = {
    async signup(name: string, email: string, password: string): Promise<AuthResult> {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw ApiError.BadRequest('Sign up failed');
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, password: passwordHash },
            select: { id: true, name: true, email: true, role: true },
        });

        const tokens = tokenService.generateTokens({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
        });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, email: user.email, name: user.name } };
    },

    async signin(email: string, password: string): Promise<AuthResult> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw ApiError.BadRequest('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw ApiError.BadRequest('Invalid credentials');
        }

        const tokens = tokenService.generateTokens({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
        });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, name: user.name, email: user.email } };
    },

    async logout(refreshToken: string) {
        // TODO: Add Redis blacklist for tokens
        return tokenService.removeToken(refreshToken);
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
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
        });
        if (!user) throw ApiError.UnauthorizedError();

        const tokens = tokenService.generateTokens({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
        });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, email: user.email, name: user.name } };
    },
};
