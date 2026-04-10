import { NextFunction, Request, Response } from 'express';

import { accountService } from '../services/account.service';

export const accountController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId, ...data } = req.body;
            const account = await accountService.create(Number(userId), data);

            res.status(201).json(account);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const account = await accountService.findById(Number(req.params.id));
            if (!account) {
                res.status(404).json({ message: 'Account not found' });
                return;
            }

            res.json(account);
        } catch (err) {
            next(err);
        }
    },

    async getByUserId(req: Request, res: Response, next: NextFunction) {
        try {
            const accounts = await accountService.findByUserId(Number(req.params.userId));

            res.json(accounts);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const account = await accountService.update(Number(req.params.id), req.body);

            res.json(account);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await accountService.delete(Number(req.params.id));

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },

    async getCurrentEquity(req: Request, res: Response, next: NextFunction) {
        try {
            const equity = await accountService.getCurrentEquity(Number(req.params.id));
            if (equity === null) {
                res.status(404).json({ message: 'Account not found' });
                return;
            }

            res.json({ equity });
        } catch (err) {
            next(err);
        }
    },
};
