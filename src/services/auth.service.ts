import bcrypt from 'bcrypt';

import { ROLE } from '../generated/prisma/enums';
import { prisma } from '../infra/prisma';
import { ApiError } from '../libs/api-error';
import { googleService } from './google.service';
import { tokenService } from './token.service';

type User = {
    id: number;
    email: string;
    name: string;
    role: ROLE;
};

type AuthResult = {
    user: User;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
};

function normalizeEmail(email: string): string {
    return email.toLowerCase();
}

export const authService = {
    async signup(name: string, email: string, password: string): Promise<AuthResult> {
        email = normalizeEmail(email);

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

        return {
            tokens,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },

    async signin(email: string, password: string): Promise<AuthResult> {
        email = normalizeEmail(email);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw ApiError.BadRequest('Invalid credentials');
        }

        if (!user.password) {
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

        return {
            tokens,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    },

    async signInWithGoogle(idToken: string): Promise<AuthResult> {
        const profile = await googleService.verifyIdToken(idToken);
        const email = normalizeEmail(profile.email);

        let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

        if (!user) {
            const existing = await prisma.user.findUnique({ where: { email } });
            user = existing
                ? await prisma.user.update({ where: { id: existing.id }, data: { googleId: profile.googleId } })
                : await prisma.user.create({
                      data: { name: profile.name, email, googleId: profile.googleId },
                  });
        }

        const tokens = tokenService.generateTokens({
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
        });
        await tokenService.saveToken(user.id, tokens.refreshToken);

        return { tokens, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    },

    async logout(refreshToken: string) {
        // TODO: Add Redis blacklist for tokens
        const userData = tokenService.validateRefreshToken(refreshToken);
        if (userData) {
            await tokenService.removeToken(userData.id);
        }
    },

    async refresh(refreshToken: string): Promise<AuthResult> {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateRefreshToken(refreshToken);
        if (!userData) {
            throw ApiError.UnauthorizedError();
        }

        const isTokenValid = await tokenService.checkToken(userData.id, refreshToken);
        if (!isTokenValid) {
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

        return {
            tokens,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    },
};
