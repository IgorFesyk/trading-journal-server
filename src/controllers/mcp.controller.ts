import { NextFunction, Request, Response } from 'express';

import { mcpTokenService } from '../services/mcp-token.service';

export const mcpController = {
    async getTokenStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const hasToken = await mcpTokenService.hasToken(req.user.id);
            res.json({ hasToken });
        } catch (err) {
            next(err);
        }
    },

    async generateToken(req: Request, res: Response, next: NextFunction) {
        try {
            const token = await mcpTokenService.generateToken(req.user.id);
            res.json({ token });
        } catch (err) {
            next(err);
        }
    },

    async revokeToken(req: Request, res: Response, next: NextFunction) {
        try {
            await mcpTokenService.revokeToken(req.user.id);
            res.sendStatus(200);
        } catch (err) {
            next(err);
        }
    },
};
