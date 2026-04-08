import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../api-error';
import { tokenService } from '../services/token.service';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (!accessToken) {
            throw ApiError.UnauthorizedError();
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            throw ApiError.UnauthorizedError();
        }

        next();
    } catch {
        next(ApiError.UnauthorizedError());
    }
}
