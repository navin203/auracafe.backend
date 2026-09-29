import { ProfileModel } from '../models/profile.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class UserController {
  /**
   * Get user profile
   * GET /api/user/profile
   */
  static async getProfile(req, res, next) {
    try {
      const profile = await ProfileModel.getById(req.user.id, req.token);

      return successResponse(res, {
        profile: profile || {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0],
          avatar_url: null
        }
      }, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update user profile
   * PUT /api/user/profile
   */
  static async updateProfile(req, res, next) {
    try {
      const { fullName, avatarUrl } = req.body;

      const updates = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;

      const profile = await ProfileModel.update(req.user.id, updates, req.token);

      return successResponse(res, { profile }, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }
}
