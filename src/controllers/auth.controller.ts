import { CookieOptions, NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service';

const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const cookieOptions: CookieOptions = {
    maxAge: REFRESH_TOKEN_MAX_AGE,
    httpOnly: true,
    sameSite: true,
};

export const authController = {
    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            const data = await authService.signup(name, email, password);

            res.cookie('refreshToken', data.tokens.refreshToken, cookieOptions);
            res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    },

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const data = await authService.signin(email, password);

            res.cookie('refreshToken', data.tokens.refreshToken, cookieOptions);
            res.json(data);
        } catch (err) {
            next(err);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }

            res.clearCookie('refreshToken');
            res.sendStatus(200);
        } catch (err) {
            next(err);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            const data = await authService.refresh(refreshToken);

            res.cookie('refreshToken', data.tokens.refreshToken, cookieOptions);
            res.json(data);
        } catch (err) {
            next(err);
        }
    },
};
