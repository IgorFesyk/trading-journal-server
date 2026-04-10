import { NextFunction, Request, Response } from 'express';
import { userService } from '../services/user.service';

export const userController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, email, password } = req.body;
            const user = await userService.create(name, email, password);

            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await userService.findById(Number(req.params.id));
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }

            res.json(user);
        } catch (err) {
            next(err);
        }
    },

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await userService.delete(Number(req.params.id));

            res.status(204).send();
        } catch (err) {
            next(err);
        }
    },
};
