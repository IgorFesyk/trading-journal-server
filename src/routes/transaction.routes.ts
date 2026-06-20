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
    note: z.string().max(1000).optional(),
});

const updateTransactionSchema = createTransactionSchema.partial();

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
