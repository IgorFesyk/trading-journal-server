import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';
import { accountService } from '../services/account.service';

export const accountController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const account = await accountService.create({
                ...req.body,
                userId: req.user.id,
            });

            res.status(201).json(account);
        } catch (err) {
            next(err);
        }
    },

    async getMyAccounts(req: Request, res: Response, next: NextFunction) {
        try {
            const accounts = await accountService.findByUserId(req.user.id);

            res.json(accounts);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const account = await accountService.findById(Number(req.params.id), req.user.id);
            if (!account) {
                return next(ApiError.NotFound('Account not found'));
            }

            res.json(account);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const updated = await accountService.update(Number(req.params.id), req.user.id, req.body);

            res.json(updated);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await accountService.delete(Number(req.params.id), req.user.id);

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
};
