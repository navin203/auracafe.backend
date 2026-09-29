import { supabaseClient } from '../config/supabase.js';
import { ProfileModel } from '../models/profile.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
      }

      if (password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long.', 400);
      }

      if (!supabaseClient) {
        return errorResponse(res, 'Supabase authentication service is not configured.', 503);
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0]
          }
        }
      });

      if (error) {
        return errorResponse(res, error.message, 400);
      }

      return successResponse(res, {
        user: data.user,
        session: data.session
      }, 'Registration successful! You can now log in.', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log in an existing user
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
      }

      if (!supabaseClient) {
        return errorResponse(res, 'Supabase authentication service is not configured.', 503);
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return errorResponse(res, error.message, 401);
      }

      let profile = null;
      try {
        profile = await ProfileModel.getById(data.user.id, data.session?.access_token);
      } catch {
        // Fallback profile object if table trigger hasn't fired yet
        profile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
        };
      }

      return successResponse(res, {
        user: data.user,
        profile,
        token: data.session?.access_token,
        session: data.session
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log out
   * POST /api/auth/logout
   */
  static async logout(req, res, next) {
    try {
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      return successResponse(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get current authenticated user details
   * GET /api/auth/me
   */
  static async getMe(req, res, next) {
    try {
      const profile = await ProfileModel.getById(req.user.id, req.token);
      return successResponse(res, {
        user: req.user,
        profile: profile || {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0]
        }
      }, 'Current session retrieved');
    } catch (err) {
      next(err);
    }
  }
}
