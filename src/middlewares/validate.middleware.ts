import { NextFunction, Response, Request } from 'express';
import z from 'zod';

export function validateMiddleware(schema: z.Schema, target: 'body' | 'query' = 'body') {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            return next(result.error);
        }

        req[target] = result.data;

        next();
    };
}
