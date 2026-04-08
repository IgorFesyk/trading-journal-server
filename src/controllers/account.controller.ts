import { Request, Response } from 'express';
import { accountService } from '../services/account.service';

export const accountController = {
    async create(req: Request, res: Response) {
        const { userId, ...data } = req.body;
        const account = await accountService.create(Number(userId), data);

        res.status(201).json(account);
    },

    async getById(req: Request, res: Response) {
        const account = await accountService.findById(Number(req.params.id));
        if (!account) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        res.json(account);
    },

    async getByUserId(req: Request, res: Response) {
        const accounts = await accountService.findByUserId(Number(req.params.userId));

        res.json(accounts);
    },

    async update(req: Request, res: Response) {
        const account = await accountService.update(Number(req.params.id), req.body);

        res.json(account);
    },

    async delete(req: Request, res: Response) {
        await accountService.delete(Number(req.params.id));

        res.status(204).send();
    },

    async getCurrentEquity(req: Request, res: Response) {
        const equity = await accountService.getCurrentEquity(Number(req.params.id));
        if (equity === null) {
            res.status(404).json({ message: 'Account not found' });
            return;
        }

        res.json({ equity });
    },
};
