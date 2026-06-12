import { NextFunction, Request, Response } from 'express';
import z from 'zod';

export function validateMiddleware(schema: z.Schema, target: 'body' | 'query' = 'body') {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            return next(result.error);
        }

        if (target === 'query') {
            Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
        } else {
            req[target] = result.data;
        }

        next();
    };
}
