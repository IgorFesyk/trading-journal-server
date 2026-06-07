import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';
import { tokenService } from '../services/token.service';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
        return next(ApiError.UnauthorizedError());
    }

    req.user = userData;
    next();
}
