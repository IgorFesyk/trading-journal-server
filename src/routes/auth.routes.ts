import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router: Router = Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/logout', authController.logout);
router.get('/refresh', authController.refresh);

export default router;
