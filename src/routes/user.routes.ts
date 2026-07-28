import { Router } from 'express';
import z from 'zod';

import { userController } from '../controllers/user.controller';
import { ROLE } from '../generated/prisma/enums';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminMiddleware } from '../middlewares/require-admin.middleware';
import { validateMiddleware } from '../middlewares/validate.middleware';

const getUsersQuerySchema = z.object({
    role: z.enum(ROLE).optional(),
});

const updateRoleSchema = z.object({
    role: z.enum(ROLE),
});

const router: Router = Router();

router.get('/me', authMiddleware, userController.getMe);
router.get(
    '/',
    authMiddleware,
    requireAdminMiddleware,
    validateMiddleware(getUsersQuerySchema, 'query'),
    userController.getAll
);
router.patch(
    '/:id/role',
    authMiddleware,
    requireAdminMiddleware,
    validateMiddleware(updateRoleSchema),
    userController.updateRole
);

export default router;
