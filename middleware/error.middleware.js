import { errorResponse } from '../utils/responseHandler.js';

export const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  // Google Places API specific errors
  if (err.response && err.response.data) {
    const googleStatus = err.response.data.status;
    const googleMsg = err.response.data.error_message || 'Google API error';

    if (googleStatus === 'OVER_QUERY_LIMIT') {
      return errorResponse(res, 'Google Places API quota exceeded. Please check your Google Cloud billing or try later.', 429, googleMsg);
    }
    if (googleStatus === 'REQUEST_DENIED') {
      return errorResponse(res, 'Google Maps / Places API request was denied. Please verify your API key and enabled APIs in Google Cloud Console.', 403, googleMsg);
    }
    if (googleStatus === 'INVALID_REQUEST') {
      return errorResponse(res, 'Invalid request sent to Google Places API.', 400, googleMsg);
    }
  }

  // Supabase errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('PGRST')) {
    return errorResponse(res, 'Database error occurred. Please verify your Supabase schema and permissions.', 500, err.message);
  }

  // Fallback generic error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error occurred.';

  return errorResponse(res, message, statusCode, err.stack);
};
