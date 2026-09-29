import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV, validateEnv } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { apiLimiter } from './middleware/rateLimiter.middleware.js';

// Route imports
import cafeRoutes from './routes/cafe.routes.js';
import authRoutes from './routes/auth.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import historyRoutes from './routes/history.routes.js';
import comparisonRoutes from './routes/comparison.routes.js';
import userRoutes from './routes/user.routes.js';

// Initialize and validate environment
validateEnv();

const app = express();

// Security and CORS
app.use(cors({
  origin: (origin, callback) => {
    // Allow local dev origins or server-to-server
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Request loggers & parsers
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    services: {
      googlePlaces: !!(ENV.GOOGLE_PLACES_API_KEY || ENV.GOOGLE_MAPS_API_KEY),
      supabase: !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY)
    }
  });
});

// Mount API routes
app.use('/api/cafes', cafeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/search-history', historyRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/user', userRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found.`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`☕ Cafe Finder Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${ENV.NODE_ENV}`);
  console.log(`🗺️  Google Places: ${ENV.GOOGLE_PLACES_API_KEY ? 'Configured' : 'Missing Key'}`);
  console.log(`⚡ Supabase: ${ENV.SUPABASE_URL ? 'Configured' : 'Missing URL'}`);
  console.log(`====================================================`);
});

export default app;
