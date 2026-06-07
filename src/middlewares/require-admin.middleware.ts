import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';

export function requireAdminMiddleware(req: Request, _res: Response, next: NextFunction) {
    if (req.user.role === 'ADMIN') {
        return next();
    }

    return next(ApiError.ForbiddenError());
}
