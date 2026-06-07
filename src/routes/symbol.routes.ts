import { Router } from 'express';
import z from 'zod';

import { CATEGORY } from '../generated/prisma/enums';
import { symbolController } from '../controllers/symbol.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminMiddleware } from '../middlewares/require-admin.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';

const createSymbolSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum(CATEGORY),
});

const updateSymbolSchema = createSymbolSchema.partial();

const getSymbolsQuerySchema = z.object({
    category: z.enum(CATEGORY).optional(),
});

const router: Router = Router();

router.get('/', authMiddleware, validateMiddleware(getSymbolsQuerySchema, 'query'), symbolController.getAll);
router.get('/:id', authMiddleware, symbolController.getById);
router.post(
    '/',
    authMiddleware,
    requireAdminMiddleware,
    validateMiddleware(createSymbolSchema),
    symbolController.create
);
router.put(
    '/:id',
    authMiddleware,
    requireAdminMiddleware,
    validateMiddleware(updateSymbolSchema),
    symbolController.update
);
router.delete('/:id', authMiddleware, requireAdminMiddleware, symbolController.delete);

export default router;
