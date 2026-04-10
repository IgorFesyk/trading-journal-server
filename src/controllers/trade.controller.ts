import { NextFunction, Request, Response } from 'express';
import { tradeService } from '../services/trade.service';

export const tradeController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { accountId, ...data } = req.body;
            const trade = await tradeService.create(Number(accountId), data);

            res.status(201).json(trade);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const trade = await tradeService.findById(Number(req.params.id));
            if (!trade) {
                res.status(404).json({ message: 'Trade not found' });
                return;
            }

            res.json(trade);
        } catch (err) {
            next(err);
        }
    },

    async getByAccountId(req: Request, res: Response, next: NextFunction) {
        try {
            const trades = await tradeService.findByAccountId(Number(req.params.accountId));

            res.json(trades);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const trade = await tradeService.update(Number(req.params.id), req.body);

            res.json(trade);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await tradeService.delete(Number(req.params.id));

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
};
