import { Router } from 'express';

import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

router.get('/me', authMiddleware, userController.getMe);

export default router;
