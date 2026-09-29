import { errorResponse } from '../utils/responseHandler.js';

export const validateSearchQuery = (req, res, next) => {
  const { query, lat, lng } = req.query;

  if (!query && (lat === undefined || lng === undefined)) {
    return errorResponse(res, 'Either a search query or GPS coordinates (lat, lng) are required.', 400);
  }

  if (lat !== undefined && isNaN(Number(lat))) {
    return errorResponse(res, 'Invalid latitude value provided.', 400);
  }

  if (lng !== undefined && isNaN(Number(lng))) {
    return errorResponse(res, 'Invalid longitude value provided.', 400);
  }

  next();
};

export const validateNearbyQuery = (req, res, next) => {
  const { lat, lng } = req.query;

  if (lat === undefined || lng === undefined) {
    return errorResponse(res, 'Both latitude (lat) and longitude (lng) are required for nearby search.', 400);
  }

  if (isNaN(Number(lat)) || isNaN(Number(lng))) {
    return errorResponse(res, 'Invalid latitude or longitude coordinates.', 400);
  }

  next();
};

export const validatePlaceId = (req, res, next) => {
  const { placeId } = req.params;

  if (!placeId || typeof placeId !== 'string' || placeId.trim().length === 0) {
    return errorResponse(res, 'A valid Google placeId is required.', 400);
  }

  next();
};

export const validateComparisonBody = (req, res, next) => {
  const { placeIds, preference } = req.body;

  if (!Array.isArray(placeIds) || placeIds.length < 2) {
    return errorResponse(res, 'Please provide an array of at least 2 Google place IDs to compare.', 400);
  }

  if (placeIds.length > 5) {
    return errorResponse(res, 'You can compare a maximum of 5 cafes at a time for optimal readability.', 400);
  }

  const validPreferences = [
    'default',
    'highest_rated',
    'closest',
    'budget_friendly',
    'most_reviewed',
    'currently_open',
    'study',
    'meeting',
    'casual'
  ];

  if (preference && !validPreferences.includes(preference)) {
    return errorResponse(res, `Invalid preference. Allowed values: ${validPreferences.join(', ')}`, 400);
  }

  next();
};
