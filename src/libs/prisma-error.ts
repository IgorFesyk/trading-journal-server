import { Prisma } from '../generated/prisma/client';
import { ApiError } from './api-error';

export function fromPrismaError(err: unknown): ApiError | null {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

    if (err.code === 'P2025') return ApiError.NotFound('Record not found');
    if (err.code === 'P2002') return ApiError.BadRequest('Record already exists');

    return null;
}
