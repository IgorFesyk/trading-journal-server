import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router: Router = Router();

router.post('/', userController.create);
router.get('/:id', userController.getById);
router.delete('/:id', userController.delete);

export default router;
