import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { ApiError } from '../libs/api-error';
import { fromPrismaError } from '../libs/prisma-error';

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    const prismaError = fromPrismaError(err);
    if (prismaError) {
        res.status(prismaError.status).json({ message: prismaError.message, errors: prismaError.errors });
        return;
    }

    if (err instanceof ZodError) {
        res.status(400).json({ errors: err.issues });
        return;
    }

    if (err instanceof ApiError) {
        res.status(err.status).json({ message: err.message, errors: err.errors });
        return;
    }

    console.error('[Unexpected Error]', err);
    res.status(500).json({ message: 'Unexpected error' });
}
