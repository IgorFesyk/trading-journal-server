import { Router } from 'express';

import { versionController } from '../controllers/version.controller';

const router: Router = Router();

router.get('/', versionController.getCurrent);
router.get('/available', versionController.getAllAvailable);
router.get('/client', versionController.getClientCurrent);
router.get('/client/available', versionController.getClientAllAvailable);

export default router;
