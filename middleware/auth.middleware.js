import { supabaseClient } from '../config/supabase.js';
import { errorResponse } from '../utils/responseHandler.js';

/**
 * Authentication middleware that verifies Supabase JWT token
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please login.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Invalid token format.', 401);
    }

    // Verify token with Supabase
    if (supabaseClient) {
      const { data: { user }, error } = await supabaseClient.auth.getUser(token);
      if (error || !user) {
        return errorResponse(res, 'Invalid or expired session. Please log in again.', 401);
      }
      req.user = user;
      req.token = token;
      return next();
    }

    // Fallback if supabase client is not initialized in dev mode
    return errorResponse(res, 'Auth service temporarily unavailable.', 503);
  } catch (err) {
    return errorResponse(res, 'Authentication failed.', 401, err.message);
  }
};

/**
 * Optional authentication: if token is present and valid, attaches req.user; otherwise proceeds as guest
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && supabaseClient) {
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (user) {
          req.user = user;
          req.token = token;
        }
      }
    }
  } catch {
    // Ignore error for optional auth
  }
  return next();
};
