import { Router } from 'express';
import z from 'zod';

import { authController } from '../controllers/auth.controller';
import { validateMiddleware } from '../middlewares/validate.middleware';

const signupSchema = z.object({
    name: z.string('Name must be a string').nonempty('Name is required').max(50, 'Name must be at most 50 characters'),
    email: z.email('Email must be a valid email address'),
    password: z
        .string('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters'),
});

const signinSchema = z.object({
    email: z.email('Email must be a valid email address'),
    password: z
        .string('Password is required')
        .min(8, 'Password must be at least 8 characters')
        .max(64, 'Password must be at most 64 characters'),
});

const googleSchema = z.object({
    credential: z.string().nonempty('Credential is required'),
});

const router: Router = Router();

router.post('/sign-up', validateMiddleware(signupSchema), authController.signup);
router.post('/sign-in', validateMiddleware(signinSchema), authController.signin);
router.post('/google', validateMiddleware(googleSchema), authController.google);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

export default router;
