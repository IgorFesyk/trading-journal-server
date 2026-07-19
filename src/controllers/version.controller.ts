import { NextFunction, Request, Response } from 'express';

import { versionService } from '../services/version.service';

export const versionController = {
    getCurrent(req: Request, res: Response) {
        res.json({ version: versionService.getCurrent() });
    },

    async getAllAvailable(req: Request, res: Response, next: NextFunction) {
        try {
            const versions = await versionService.getAllAvailable();
            res.json({ versions });
        } catch (err) {
            next(err);
        }
    },
};
