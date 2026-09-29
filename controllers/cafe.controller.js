import {
  searchCafesByQuery,
  searchCafesNearby,
  getPlaceDetails,
  getPhotoStream,
  geocodeLocation
} from '../services/googlePlaces.service.js';
import { generateFactualSummary } from '../services/comparison.service.js';
import { calculateRecommendations } from '../services/recommendation.service.js';
import { FavoriteModel } from '../models/favorite.model.js';
import { HistoryModel } from '../models/history.model.js';
import { successResponse, errorResponse } from '../utils/responseHandler.js';

export class CafeController {
  /**
   * Search cafes by text query or location
   * GET /api/cafes/search?query=...&lat=...&lng=...&radius=...
   */
  static async search(req, res, next) {
    try {
      const { query = '', lat, lng, radius } = req.query;

      let searchLat = lat ? Number(lat) : null;
      let searchLng = lng ? Number(lng) : null;
      let locationName = null;

      // If user typed a location without coordinates, geocode first if helpful
      if (query && (!searchLat || !searchLng)) {
        try {
          const geocodeRes = await geocodeLocation(query);
          if (geocodeRes) {
            locationName = geocodeRes.formatted_address;
            searchLat = geocodeRes.location.lat;
            searchLng = geocodeRes.location.lng;
          }
        } catch {
          // If geocoding fails, fallback to pure text search
        }
      }

      const result = await searchCafesByQuery({
        query: query || 'cafes',
        lat: searchLat,
        lng: searchLng,
        radius: radius ? Number(radius) : 50000
      });

      // Record to search history if authenticated
      if (req.user && query) {
        HistoryModel.addSearch(req.user.id, {
          query,
          locationName: locationName || query,
          lat: searchLat,
          lng: searchLng
        }, req.token).catch(() => {});
      }

      return successResponse(res, {
        cafes: result.cafes,
        searchCenter: result.searchCenter,
        total: result.cafes.length,
        query,
        locationName
      }, 'Cafes retrieved successfully from Google Places');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Search cafes nearby GPS coordinates
   * GET /api/cafes/nearby?lat=...&lng=...&radius=...&keyword=...
   */
  static async getNearby(req, res, next) {
    try {
      const { lat, lng, radius = 5000, keyword = 'cafe' } = req.query;

      const result = await searchCafesNearby({
        lat: Number(lat),
        lng: Number(lng),
        radius: Number(radius),
        keyword
      });

      return successResponse(res, {
        cafes: result.cafes,
        searchCenter: result.searchCenter,
        total: result.cafes.length
      }, 'Nearby cafes retrieved successfully from Google Places');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single cafe details by Google placeId
   * GET /api/cafes/:placeId?lat=...&lng=...
   */
  static async getDetails(req, res, next) {
    try {
      const { placeId } = req.params;
      const { lat, lng } = req.query;

      const userLat = lat ? Number(lat) : null;
      const userLng = lng ? Number(lng) : null;

      const cafe = await getPlaceDetails(placeId, userLat, userLng);

      if (!cafe) {
        return errorResponse(res, 'Cafe not found on Google Places.', 404);
      }

      // Check if favorited by authenticated user
      let isFavorite = false;
      if (req.user) {
        isFavorite = await FavoriteModel.isFavorite(req.user.id, placeId, req.token);
      }

      return successResponse(res, {
        cafe: {
          ...cafe,
          isFavorite
        }
      }, 'Cafe details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Compare 2 to 5 cafes side-by-side with factual summary & transparent recommendation score
   * POST /api/cafes/compare
   * Body: { placeIds: string[], preference: string, userLat?: number, userLng?: number }
   */
  static async compare(req, res, next) {
    try {
      const { placeIds, preference = 'default', userLat, userLng } = req.body;

      const lat = userLat !== undefined ? Number(userLat) : null;
      const lng = userLng !== undefined ? Number(userLng) : null;

      // Fetch place details for all requested cafes concurrently from Google Places
      const cafePromises = placeIds.map(id => getPlaceDetails(id, lat, lng));
      const rawCafes = await Promise.all(cafePromises);

      // Filter out any invalid / unfound IDs
      const validCafes = rawCafes.filter(Boolean);

      if (validCafes.length < 2) {
        return errorResponse(res, 'At least 2 valid cafes are required for comparison.', 400);
      }

      // 1. Generate factual comparison summary (strict real data only)
      const factualSummary = generateFactualSummary(validCafes);

      // 2. Calculate transparent App Comparison Score & preference matching
      const scoredCafes = calculateRecommendations(validCafes, preference);

      // 3. Identify top recommended cafe under this preference
      const topPick = scoredCafes.length > 0 ? scoredCafes[0] : null;

      return successResponse(res, {
        cafes: scoredCafes,
        factualSummary,
        preference,
        topPick,
        count: scoredCafes.length
      }, 'Cafes compared successfully based on verified Google Places data');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Proxy Google Place Photo
   * GET /api/cafes/photo?ref=...&maxWidth=...
   */
  static async getPhoto(req, res, next) {
    try {
      const { ref, maxWidth = 800 } = req.query;

      if (!ref) {
        return errorResponse(res, 'Photo reference parameter (ref) is required.', 400);
      }

      const streamResponse = await getPhotoStream(ref, maxWidth);
      res.setHeader('Content-Type', streamResponse.headers['content-type'] || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
      streamResponse.data.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Return client-safe configuration (Google Maps API key for browser rendering)
   * GET /api/cafes/config
   */
  static async getConfig(req, res) {
    const key = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';
    return successResponse(res, {
      googleMapsApiKey: key,
      hasKey: !!key,
      supabaseConfigured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    }, 'Public configuration retrieved');
  }
}

