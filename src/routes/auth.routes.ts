import { Router } from 'express';

import { authController } from '../controllers/auth.controller';
import { validateMiddleware } from '../middlewares/validate.middleware';
import z from 'zod';

const signupSchema = z.object({
    name: z.string('Name must be a string').nonempty('Name is required'),
    email: z.string('Email is required').email('Email must be a valid email address'),
    password: z
        .string('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters'),
});

const signinSchema = z.object({
    email: z.string('Email is required').email('Email must be a valid email address'),
    password: z
        .string('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters'),
});

const router: Router = Router();

router.post('/sign-up', validateMiddleware(signupSchema), authController.signup);
router.post('/sign-in', validateMiddleware(signinSchema), authController.signin);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

export default router;
