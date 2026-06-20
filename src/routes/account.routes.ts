import { Router } from 'express';
import z from 'zod';

import { accountController } from '../controllers/account.controller';
import { ACCOUNT_TYPE, CURRENCY } from '../generated/prisma/enums';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';
import tradeRoutes from './trade.routes';
import transactionRoutes from './transaction.routes';

const createAccountSchema = z.object({
    name: z.string('Name must be a string').nonempty('Name is required').max(50, 'Name must be at most 50 characters'),
    type: z.enum(ACCOUNT_TYPE),
    currency: z.enum(CURRENCY),
    startingEquity: z.coerce.number().int().positive(),
    targetEquity: z.coerce.number().int().positive().optional(),
});

const updateAccountSchema = createAccountSchema.partial();

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const router: Router = Router();

router.post('/', authMiddleware, validateMiddleware(createAccountSchema), accountController.create);
router.get('/', authMiddleware, accountController.getMyAccounts);
router.get('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), accountController.getById);
router.put(
    '/:id',
    authMiddleware,
    validateMiddleware(idParamSchema, 'params'),
    validateMiddleware(updateAccountSchema),
    accountController.update
);
router.delete('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), accountController.delete);

router.get(
    '/:id/stats',
    authMiddleware,
    validateMiddleware(idParamSchema, 'params'),
    accountController.getAccountStats
);

router.use('/:accountId/trades', tradeRoutes);
router.use('/:accountId/transactions', transactionRoutes);

export default router;
