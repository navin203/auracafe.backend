import { ComparisonModel } from '../models/comparison.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class ComparisonController {
  /**
   * Save a cafe comparison
   * POST /api/comparisons
   */
  static async saveComparison(req, res, next) {
    try {
      const { title, preference, notes, cafes } = req.body;

      if (!title || !title.trim()) {
        return errorResponse(res, 'A title is required to save a comparison.', 400);
      }

      if (!Array.isArray(cafes) || cafes.length < 2) {
        return errorResponse(res, 'At least 2 cafes are required to save a comparison.', 400);
      }

      const comparison = await ComparisonModel.createComparison(
        req.user.id,
        {
          title: title.trim(),
          preference: preference || 'default',
          notes: notes ? notes.trim() : null,
          cafes
        },
        req.token
      );

      return successResponse(res, { comparison }, 'Comparison saved successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all saved comparisons for current user
   * GET /api/comparisons
   */
  static async getComparisons(req, res, next) {
    try {
      const comparisons = await ComparisonModel.getComparisons(req.user.id, req.token);
      return successResponse(res, { comparisons }, 'Saved comparisons retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single saved comparison by ID
   * GET /api/comparisons/:id
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const comparison = await ComparisonModel.getById(req.user.id, id, req.token);

      if (!comparison) {
        return errorResponse(res, 'Comparison not found.', 404);
      }

      return successResponse(res, { comparison }, 'Comparison retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete a saved comparison
   * DELETE /api/comparisons/:id
   */
  static async deleteComparison(req, res, next) {
    try {
      const { id } = req.params;
      await ComparisonModel.deleteComparison(req.user.id, id, req.token);
      return successResponse(res, null, 'Comparison deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
