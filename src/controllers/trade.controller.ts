import { NextFunction, Request, Response } from 'express';

import { DIRECTION, TRADE_STATUS } from '../generated/prisma/enums';
import { ApiError } from '../libs/api-error';
import { tradeService } from '../services/trade.service';

export const tradeController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const trade = await tradeService.create(
                { ...req.body, accountId: Number(req.params.accountId) },
                req.user.id
            );

            res.status(201).json(trade);
        } catch (err) {
            next(err);
        }
    },

    async getByAccount(
        req: Request<{ accountId: string }, unknown, unknown, { status?: TRADE_STATUS; direction?: DIRECTION }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const trades = await tradeService.findByAccount(Number(req.params.accountId), req.user.id, {
                status: req.query.status,
                direction: req.query.direction,
            });

            res.json(trades);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const trade = await tradeService.findById(Number(req.params.id), Number(req.params.accountId), req.user.id);
            if (!trade) {
                return next(ApiError.NotFound('Trade not found'));
            }

            res.json(trade);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const accountId = Number(req.params.accountId);
            const id = Number(req.params.id);

            const { count } = await tradeService.update(id, accountId, req.user.id, req.body);
            if (count === 0) {
                return next(ApiError.NotFound('Trade not found'));
            }

            const trade = await tradeService.findById(id, accountId, req.user.id);
            res.json(trade);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { count } = await tradeService.delete(
                Number(req.params.id),
                Number(req.params.accountId),
                req.user.id
            );
            if (count === 0) {
                return next(ApiError.NotFound('Trade not found'));
            }

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
};
