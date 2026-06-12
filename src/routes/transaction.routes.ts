import { Router } from 'express';
import z from 'zod';

import { transactionController } from '../controllers/transaction.controller';
import { TRANSACTION_TYPE } from '../generated/prisma/enums';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';

const createTransactionSchema = z.object({
    type: z.enum(TRANSACTION_TYPE),
    amount: z.coerce.number().int().positive(),
    occurredAt: z.coerce.date(),
    note: z.string().optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

const getTransactionsQuerySchema = z.object({
    type: z.enum(TRANSACTION_TYPE).optional(),
});

const router: Router = Router({ mergeParams: true });

router.post('/', authMiddleware, validateMiddleware(createTransactionSchema), transactionController.create);
router.get(
    '/',
    authMiddleware,
    validateMiddleware(getTransactionsQuerySchema, 'query'),
    transactionController.getByAccount
);
router.get('/:id', authMiddleware, transactionController.getById);
router.put('/:id', authMiddleware, validateMiddleware(updateTransactionSchema), transactionController.update);
router.delete('/:id', authMiddleware, transactionController.delete);

export default router;
