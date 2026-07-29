import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';
import { mcpTokenService } from '../services/mcp-token.service';

export async function mcpAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(ApiError.UnauthorizedError());
    }

    const user = await mcpTokenService.validateToken(token);
    if (!user) {
        return next(ApiError.UnauthorizedError());
    }

    req.user = user;
    next();
}
