import express from 'express';
import { HistoryController } from '../controllers/history.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', HistoryController.getHistory);
router.post('/', HistoryController.addHistory);
router.delete('/:id', HistoryController.deleteHistory);
router.delete('/', HistoryController.clearHistory);

export default router;
