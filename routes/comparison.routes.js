import express from 'express';
import { ComparisonController } from '../controllers/comparison.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', ComparisonController.getComparisons);
router.post('/', ComparisonController.saveComparison);
router.get('/:id', ComparisonController.getById);
router.delete('/:id', ComparisonController.deleteComparison);

export default router;
