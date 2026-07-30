import { Router } from 'express';
import z from 'zod';

import { transactionController } from '../controllers/transaction.controller';
import { TRANSACTION_TYPE } from '../generated/prisma/enums';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';

const transactionShapeSchema = z.object({
    type: z.enum(TRANSACTION_TYPE),
    amount: z.coerce.number().int(),
    occurredAt: z.coerce.date(),
    note: z.string().max(1000).optional(),
});

function validateAmountSign(data: { type?: TRANSACTION_TYPE; amount?: number }, ctx: z.RefinementCtx) {
    if (data.type === undefined || data.amount === undefined) return;

    if (data.type === 'DEPOSIT' && data.amount <= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Amount must be positive for a deposit' });
    }
    if (data.type === 'WITHDRAWAL' && data.amount >= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Amount must be negative for a withdrawal' });
    }
    if (data.type === 'ADJUSTMENT' && data.amount === 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'Amount cannot be zero' });
    }
}

const createTransactionSchema = transactionShapeSchema.superRefine(validateAmountSign);
const updateTransactionSchema = transactionShapeSchema.partial().superRefine(validateAmountSign);

const getTransactionsQuerySchema = z.object({
    type: z.enum(TRANSACTION_TYPE).optional(),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const router: Router = Router({ mergeParams: true });

router.post('/', authMiddleware, validateMiddleware(createTransactionSchema), transactionController.create);
router.get(
    '/',
    authMiddleware,
    validateMiddleware(getTransactionsQuerySchema, 'query'),
    transactionController.getByAccount
);
router.get('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), transactionController.getById);
router.put(
    '/:id',
    authMiddleware,
    validateMiddleware(idParamSchema, 'params'),
    validateMiddleware(updateTransactionSchema),
    transactionController.update
);
router.delete('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), transactionController.delete);

export default router;
