import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../libs/api-error';
import { userService } from '../services/user.service';

export const userController = {
    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.findById(req.user.id);
            if (!user) {
                return next(ApiError.NotFound('User not found'));
            }

            res.json(user);
        } catch (err) {
            next(err);
        }
    },
};
