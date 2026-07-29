import { Router } from 'express';

import { versionController } from '../controllers/version.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminMiddleware } from '../middlewares/require-admin.middleware';

const router: Router = Router();

router.get('/server', authMiddleware, requireAdminMiddleware, versionController.getCurrent);
router.get('/server/available', authMiddleware, requireAdminMiddleware, versionController.getAllAvailable);
router.get('/client', authMiddleware, requireAdminMiddleware, versionController.getClientCurrent);
router.get('/client/available', authMiddleware, requireAdminMiddleware, versionController.getClientAllAvailable);

export default router;
