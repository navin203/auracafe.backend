import { FavoriteModel } from '../models/favorite.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class FavoriteController {
  /**
   * Add a cafe to user favorites
   * POST /api/favorites
   */
  static async addFavorite(req, res, next) {
    try {
      const { cafe } = req.body;

      if (!cafe || !cafe.place_id || !cafe.name) {
        return errorResponse(res, 'Valid cafe object with place_id and name is required.', 400);
      }

      const favorite = await FavoriteModel.addFavorite(req.user.id, cafe, req.token);
      return successResponse(res, { favorite }, 'Cafe added to favorites', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all favorites for current user
   * GET /api/favorites
   */
  static async getFavorites(req, res, next) {
    try {
      const favorites = await FavoriteModel.getFavorites(req.user.id, req.token);
      return successResponse(res, { favorites, count: favorites.length }, 'Favorites retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove a favorite by Google placeId
   * DELETE /api/favorites/:placeId
   */
  static async removeFavorite(req, res, next) {
    try {
      const { placeId } = req.params;

      if (!placeId) {
        return errorResponse(res, 'placeId is required.', 400);
      }

      await FavoriteModel.removeFavorite(req.user.id, placeId, req.token);
      return successResponse(res, null, 'Cafe removed from favorites');
    } catch (err) {
      next(err);
    }
  }
}
