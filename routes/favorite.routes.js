import express from 'express';
import { FavoriteController } from '../controllers/favorite.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', FavoriteController.addFavorite);
router.get('/', FavoriteController.getFavorites);
router.delete('/:placeId', FavoriteController.removeFavorite);

export default router;
