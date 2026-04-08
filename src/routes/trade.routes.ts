import { Router } from 'express';
import { tradeController } from '../controllers/trade.controller';

const router: Router = Router();

router.post('/', tradeController.create);
router.get('/account/:accountId', tradeController.getByAccountId);
router.get('/:id', tradeController.getById);
router.put('/:id', tradeController.update);
router.delete('/:id', tradeController.delete);

export default router;
