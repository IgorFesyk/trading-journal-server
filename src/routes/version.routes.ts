import { Router } from 'express';

import { versionController } from '../controllers/version.controller';

const router: Router = Router();

router.get('/server', versionController.getCurrent);
router.get('/server/available', versionController.getAllAvailable);
router.get('/client', versionController.getClientCurrent);
router.get('/client/available', versionController.getClientAllAvailable);

export default router;
