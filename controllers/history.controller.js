import { HistoryModel } from '../models/history.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class HistoryController {
  /**
   * Get user's search history
   * GET /api/search-history
   */
  static async getHistory(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const history = await HistoryModel.getHistory(req.user.id, limit, req.token);
      return successResponse(res, { history }, 'Search history retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Manually record a search query
   * POST /api/search-history
   */
  static async addHistory(req, res, next) {
    try {
      const { query, locationName, lat, lng } = req.body;

      if (!query || !query.trim()) {
        return errorResponse(res, 'Search query cannot be empty.', 400);
      }

      const item = await HistoryModel.addSearch(req.user.id, {
        query: query.trim(),
        locationName,
        lat,
        lng
      }, req.token);

      return successResponse(res, { item }, 'Search query saved', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete an individual history item
   * DELETE /api/search-history/:id
   */
  static async deleteHistory(req, res, next) {
    try {
      const { id } = req.params;
      await HistoryModel.deleteItem(req.user.id, id, req.token);
      return successResponse(res, null, 'History item deleted');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Clear all search history for user
   * DELETE /api/search-history
   */
  static async clearHistory(req, res, next) {
    try {
      await HistoryModel.clearAll(req.user.id, req.token);
      return successResponse(res, null, 'Search history cleared');
    } catch (err) {
      next(err);
    }
  }
}
