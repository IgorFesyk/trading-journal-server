import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const userController = {
    async create(req: Request, res: Response) {
        const { email, password } = req.body;
        const user = await userService.create(email, password);

        res.status(201).json(user);
    },

    async getById(req: Request, res: Response) {
        const user = await userService.findById(Number(req.params.id));
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json(user);
    },

    async delete(req: Request, res: Response) {
        await userService.delete(Number(req.params.id));

        res.status(204).send();
    },
};
