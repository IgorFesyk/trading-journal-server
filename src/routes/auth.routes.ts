import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { body } from 'express-validator';

const router: Router = Router();

router.post(
    '/signup',
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 3, max: 32 }),
    authController.signup,
);
router.post('/signin', authController.signin);
router.post('/logout', authController.logout);
router.get('/refresh', authController.refresh);

export default router;
