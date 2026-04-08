import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../api-error';

export function errorMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ApiError) {
        res.status(err.status).json({ message: err.message, errors: err.errors });
        return;
    }

    res.status(500).json({ message: 'Unexpected error' });
}
