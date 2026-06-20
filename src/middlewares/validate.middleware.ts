import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export function validateMiddleware<T extends z.ZodType<Record<string, unknown>>>(
    schema: T,
    target: 'body' | 'query' | 'params' = 'body'
) {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            return next(result.error);
        }

        if (target === 'body') {
            req.body = result.data;
        } else if (target === 'params') {
            Object.defineProperty(req, 'params', {
                value: { ...req.params, ...result.data },
                writable: true,
                configurable: true,
            });
        } else {
            Object.defineProperty(req, target, { value: result.data, writable: true, configurable: true });
        }

        next();
    };
}
