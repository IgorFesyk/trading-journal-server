import { Router } from 'express';
import { accountController } from '../controllers/account.controller';

const router: Router = Router();

router.post('/', accountController.create);
router.get('/user/:userId', accountController.getByUserId);
router.get('/:id', accountController.getById);
router.get('/:id/equity', accountController.getCurrentEquity);
router.put('/:id', accountController.update);
router.delete('/:id', accountController.delete);

export default router;
