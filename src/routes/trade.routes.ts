import { Router } from 'express';
import z from 'zod';

import { tradeController } from '../controllers/trade.controller';
import { DIRECTION, EXECUTION_SETUP, TIMEFRAME, TRADE_STATUS } from '../generated/prisma/enums';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';

const createTradeSchema = z.object({
    symbolId: z.coerce.number().int().positive(),
    risk: z.coerce.number().int().positive().max(10000, 'Risk cannot exceed 100%'),
    direction: z.enum(DIRECTION),
    entryTF: z.enum(TIMEFRAME),
    setup: z.enum(EXECUTION_SETUP),
    openedAt: z.coerce.date(),
    status: z.enum(TRADE_STATUS).default('IN_PROGRESS'),
    pnl: z.coerce.number().int().optional(),
    commission: z.coerce.number().int().default(0),
    notes: z.string().max(1000).optional(),
    closedAt: z.coerce.date().optional(),
});

const updateTradeSchema = createTradeSchema.omit({ symbolId: true }).partial();

const getTradesQuerySchema = z.object({
    status: z.enum(TRADE_STATUS).optional(),
    direction: z.enum(DIRECTION).optional(),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const router: Router = Router({ mergeParams: true });

router.post('/', authMiddleware, validateMiddleware(createTradeSchema), tradeController.create);
router.get('/', authMiddleware, validateMiddleware(getTradesQuerySchema, 'query'), tradeController.getByAccount);
router.get('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), tradeController.getById);
router.put(
    '/:id',
    authMiddleware,
    validateMiddleware(idParamSchema, 'params'),
    validateMiddleware(updateTradeSchema),
    tradeController.update
);
router.delete('/:id', authMiddleware, validateMiddleware(idParamSchema, 'params'), tradeController.delete);

export default router;
