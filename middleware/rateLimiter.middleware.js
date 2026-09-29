import rateLimit from 'express-rate-limit';

// Standard API rate limiter: 120 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a few minutes.'
  }
});

// Strict rate limiter for place searches to protect Google quota: 40 requests per minute
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Search rate limit exceeded. Please wait a moment before searching again.'
  }
});
