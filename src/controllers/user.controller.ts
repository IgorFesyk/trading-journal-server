import { NextFunction, Request, Response } from 'express';

import { ROLE } from '../generated/prisma/enums';
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

    async getAll(
        req: Request<Record<string, never>, unknown, unknown, { role?: ROLE }>,
        res: Response,
        next: NextFunction
    ) {
        try {
            const users = await userService.findAll(req.query.role);

            res.json(users);
        } catch (err) {
            next(err);
        }
    },

    async updateRole(req: Request<{ id: string }, unknown, { role: ROLE }>, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            if (id === req.user.id && req.body.role !== ROLE.ADMIN) {
                return next(ApiError.BadRequest("You can't remove your own admin role"));
            }

            const user = await userService.updateRole(id, req.body.role);

            res.json(user);
        } catch (err) {
            next(err);
        }
    },
};
