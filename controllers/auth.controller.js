import { supabaseClient, supabaseAdmin } from '../config/supabase.js';
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

      if (!supabaseClient && !supabaseAdmin) {
        return errorResponse(res, 'Supabase authentication service is not configured.', 503);
      }

      let user = null;
      let session = null;

      // Use supabaseAdmin to auto-confirm email so users never get blocked by "Email not confirmed"
      if (supabaseAdmin) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName || email.split('@')[0]
          }
        });

        if (error) {
          // If already registered or error, report message
          return errorResponse(res, error.message, 400);
        }
        user = data.user;

        // Automatically sign in to generate a session
        const loginRes = await supabaseClient.auth.signInWithPassword({ email, password });
        session = loginRes.data?.session || null;
      } else {
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
        user = data.user;
        session = data.session;
      }

      return successResponse(res, {
        user,
        session
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

      let { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      // If email is not confirmed, auto-confirm it using supabaseAdmin and retry login!
      if (error && error.message === 'Email not confirmed' && supabaseAdmin) {
        try {
          const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
          const existing = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
          if (existing) {
            await supabaseAdmin.auth.admin.updateUserById(existing.id, {
              email_confirm: true
            });

            // Retry signing in
            const retryRes = await supabaseClient.auth.signInWithPassword({ email, password });
            data = retryRes.data;
            error = retryRes.error;
          }
        } catch (confirmErr) {
          console.error('Auto-confirm attempt failed:', confirmErr);
        }
      }

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
      let profile = null;
      try {
        profile = await ProfileModel.getById(req.user.id, req.token);
      } catch (profileErr) {
        // Fallback gracefully so session stays active even if profiles table hasn't been migrated yet
      }

      return successResponse(res, {
        user: req.user,
        profile: profile || {
          id: req.user.id,
          email: req.user.email,
          full_name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'User'
        }
      }, 'Current session retrieved');
    } catch (err) {
      next(err);
    }
  }
}

