import { Request, Response } from 'express';
import { tradeService } from '../services/trade.service';

export const tradeController = {
    async create(req: Request, res: Response) {
        const { accountId, ...data } = req.body;
        const trade = await tradeService.create(Number(accountId), data);

        res.status(201).json(trade);
    },

    async getById(req: Request, res: Response) {
        const trade = await tradeService.findById(Number(req.params.id));
        if (!trade) {
            res.status(404).json({ message: 'Trade not found' });
            return;
        }

        res.json(trade);
    },

    async getByAccountId(req: Request, res: Response) {
        const trades = await tradeService.findByAccountId(Number(req.params.accountId));

        res.json(trades);
    },

    async update(req: Request, res: Response) {
        const trade = await tradeService.update(Number(req.params.id), req.body);

        res.json(trade);
    },

    async delete(req: Request, res: Response) {
        await tradeService.delete(Number(req.params.id));

        res.status(204).send();
    },
};
