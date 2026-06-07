import { NextFunction, Request, Response } from 'express';
import { CATEGORY } from '../generated/prisma/enums';
import { symbolService } from '../services/symbol.service';
import { ApiError } from '../libs/api-error';

export const symbolController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = await symbolService.create(req.body);
            res.status(201).json(symbol);
        } catch (err) {
            next(err);
        }
    },

    async getAll(
        req: Request<Record<string, never>, unknown, unknown, { category?: CATEGORY }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const symbols = await symbolService.findAll(req.query.category);

            res.json(symbols);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const symbol = await symbolService.findById(Number(req.params.id));
            if (!symbol) {
                return next(ApiError.NotFound('Symbol not found'));
            }

            res.json(symbol);
        } catch (err) {
            next(err);
        }
    },

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const updated = await symbolService.update(Number(req.params.id), req.body);
            res.json(updated);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await symbolService.delete(Number(req.params.id));
            res.sendStatus(204);
        } catch (err) {
            next(err);
        }
    },
};
