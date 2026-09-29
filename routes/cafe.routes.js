import express from 'express';
import { CafeController } from '../controllers/cafe.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import {
  validateSearchQuery,
  validateNearbyQuery,
  validatePlaceId,
  validateComparisonBody
} from '../middleware/validate.middleware.js';
import { searchLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

// Search cafes by query or coordinates
router.get('/search', searchLimiter, optionalAuth, validateSearchQuery, CafeController.search);

// Search cafes nearby coordinates
router.get('/nearby', searchLimiter, optionalAuth, validateNearbyQuery, CafeController.getNearby);

// Client configuration endpoint
router.get('/config', CafeController.getConfig);

// Proxy place photos securely
router.get('/photo', CafeController.getPhoto);

// Compare 2 to 5 cafes side-by-side
router.post('/compare', optionalAuth, validateComparisonBody, CafeController.compare);

// Single cafe details
router.get('/:placeId', optionalAuth, validatePlaceId, CafeController.getDetails);

export default router;
