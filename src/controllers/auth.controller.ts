import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { authService } from '../services/auth.service';
import { ApiError } from '../api-error';

const REFRESH_TOKEN_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day

export const authController = {
    async signup(req: Request, res: Response, next: NextFunction) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return next(ApiError.BadRequest('Validation errors', errors.array()));
            }

            const { name, email, password } = req.body;
            const data = await authService.signup(name, email, password);

            res.cookie('refreshToken', data.tokens.refreshToken, { maxAge: REFRESH_TOKEN_MAX_AGE, httpOnly: true });
            res.status(201).json(data);
        } catch (err) {
            next(err);
        }
    },

    async signin(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const data = await authService.signin(email, password);

            res.cookie('refreshToken', data.tokens.refreshToken, { maxAge: REFRESH_TOKEN_MAX_AGE, httpOnly: true });
            res.json(data);
        } catch (err) {
            next(err);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            await authService.logout(refreshToken);

            res.clearCookie('refreshToken');
            res.status(200).json({ message: 'Logged out' });
        } catch (err) {
            next(err);
        }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.cookies;
            const data = await authService.refresh(refreshToken);

            res.cookie('refreshToken', data.tokens.refreshToken, { maxAge: REFRESH_TOKEN_MAX_AGE, httpOnly: true });
            res.json(data);
        } catch (err) {
            next(err);
        }
    },
};
