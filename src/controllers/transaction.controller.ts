import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';
import { TRANSACTION_TYPE } from '../generated/prisma/enums';
import { transactionService } from '../services/transaction.service';

export const transactionController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const transaction = await transactionService.create(
                { ...req.body, accountId: Number(req.params.accountId) },
                req.user.id
            );

            res.status(201).json(transaction);
        } catch (err) {
            next(err);
        }
    },

    async getByAccount(
        req: Request<{ accountId: string }, unknown, unknown, { type?: TRANSACTION_TYPE }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const transactions = await transactionService.findByAccount(Number(req.params.accountId), req.user.id, {
                type: req.query.type,
            });

            res.json(transactions);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const transaction = await transactionService.findById(
                Number(req.params.id),
                Number(req.params.accountId),
                req.user.id
            );
            if (!transaction) {
                return next(ApiError.NotFound('Transaction not found'));
            }

            res.json(transaction);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const accountId = Number(req.params.accountId);
            const id = Number(req.params.id);

            const { count } = await transactionService.update(id, accountId, req.user.id, req.body);
            if (count === 0) {
                return next(ApiError.NotFound('Transaction not found'));
            }

            const transaction = await transactionService.findById(id, accountId, req.user.id);
            res.json(transaction);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { count } = await transactionService.delete(
                Number(req.params.id),
                Number(req.params.accountId),
                req.user.id
            );
            if (count === 0) {
                return next(ApiError.NotFound('Transaction not found'));
            }

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
};
