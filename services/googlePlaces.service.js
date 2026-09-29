import axios from 'axios';
import { ENV } from '../config/env.js';
import { calculateDistance } from '../utils/distance.js';

const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api';

/**
 * Normalizes raw Google Place data into our standardized Cafe model.
 * Strictly respects real data: does NOT invent any missing fields.
 */
export const normalizePlace = (raw, userLat = null, userLng = null) => {
  if (!raw) return null;

  const lat = raw.geometry?.location?.lat ?? null;
  const lng = raw.geometry?.location?.lng ?? null;

  // Calculate distance if user location is provided
  const distance = (userLat !== null && userLng !== null && lat !== null && lng !== null)
    ? calculateDistance(userLat, userLng, lat, lng)
    : { km: null, text: null };

  // Photo references
  const photos = Array.isArray(raw.photos)
    ? raw.photos.map((p) => ({
        photo_reference: p.photo_reference,
        height: p.height || null,
        width: p.width || null,
        html_attributions: p.html_attributions || [],
        url: `/api/cafes/photo?ref=${encodeURIComponent(p.photo_reference)}`
      }))
    : [];

  // Opening hours
  const openNow = raw.opening_hours?.open_now ?? null;
  const weekdayText = raw.opening_hours?.weekday_text || null;
  const periods = raw.opening_hours?.periods || null;

  return {
    place_id: raw.place_id,
    name: raw.name,
    rating: raw.rating !== undefined ? Number(raw.rating) : null,
    user_ratings_total: raw.user_ratings_total !== undefined ? Number(raw.user_ratings_total) : null,
    price_level: raw.price_level !== undefined ? Number(raw.price_level) : null,
    address: raw.formatted_address || raw.vicinity || null,
    phone_number: raw.formatted_phone_number || raw.international_phone_number || null,
    website: raw.website || null,
    google_maps_url: raw.url || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${raw.place_id}` : null),
    location: {
      lat,
      lng
    },
    distance,
    open_now: openNow,
    opening_hours: {
      open_now: openNow,
      weekday_text: weekdayText,
      periods: periods
    },
    photos,
    primary_photo: photos.length > 0 ? photos[0].url : null,
    types: raw.types || [],
    reviews: Array.isArray(raw.reviews)
      ? raw.reviews.map((r) => ({
          author_name: r.author_name || 'Google User',
          rating: r.rating || null,
          text: r.text || null,
          time: r.time || null,
          relative_time_description: r.relative_time_description || null
        }))
      : []
  };
};

/**
 * Validates Google API key existence
 */
const getApiKey = () => {
  const key = ENV.GOOGLE_PLACES_API_KEY || ENV.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('Google Places API key is not configured. Please add GOOGLE_PLACES_API_KEY to backend/.env');
  }
  return key;
};

/**
 * Geocode text location into coordinates
 */
export const geocodeLocation = async (address) => {
  const apiKey = getApiKey();
  const response = await axios.get(`${GOOGLE_BASE_URL}/geocode/json`, {
    params: {
      address,
      key: apiKey
    }
  });

  if (response.data.status === 'ZERO_RESULTS') {
    return null;
  }

  if (response.data.status !== 'OK') {
    throw new Error(response.data.error_message || `Geocoding failed with status: ${response.data.status}`);
  }

  const result = response.data.results[0];
  return {
    formatted_address: result.formatted_address,
    location: result.geometry.location,
    place_id: result.place_id
  };
};

/**
 * Search cafes by text query (e.g. "Cafes near Bhopal", "Starbucks near me", "Misrod cafe")
 */
export const searchCafesByQuery = async ({ query, lat, lng, radius = 50000 }) => {
  const apiKey = getApiKey();

  // If query doesn't specify cafe or coffee, make sure it searches for cafes in that area
  let refinedQuery = query.trim();
  const lower = refinedQuery.toLowerCase();
  if (!lower.includes('cafe') && !lower.includes('coffee') && !lower.includes('bakery') && !lower.includes('starbucks')) {
    refinedQuery = `cafes near ${refinedQuery}`;
  }

  const params = {
    query: refinedQuery,
    key: apiKey
  };

  // If coordinates provided, bias the search around location
  if (lat && lng) {
    params.location = `${lat},${lng}`;
    params.radius = radius;
  }

  const response = await axios.get(`${GOOGLE_BASE_URL}/place/textsearch/json`, { params });

  if (response.data.status === 'ZERO_RESULTS') {
    return { cafes: [], searchCenter: (lat && lng) ? { lat, lng } : null };
  }

  if (response.data.status !== 'OK') {
    throw new Error(response.data.error_message || `Places search failed with status: ${response.data.status}`);
  }

  // Derive search center location from the first result or given coords
  let centerLat = lat;
  let centerLng = lng;
  if ((!centerLat || !centerLng) && response.data.results.length > 0) {
    centerLat = response.data.results[0].geometry.location.lat;
    centerLng = response.data.results[0].geometry.location.lng;
  }

  const cafes = response.data.results.map((place) => normalizePlace(place, centerLat, centerLng));

  return {
    cafes,
    searchCenter: centerLat && centerLng ? { lat: centerLat, lng: centerLng } : null,
    next_page_token: response.data.next_page_token || null
  };
};

/**
 * Search cafes nearby given GPS coordinates
 */
export const searchCafesNearby = async ({ lat, lng, radius = 5000, keyword = 'cafe' }) => {
  const apiKey = getApiKey();

  const params = {
    location: `${lat},${lng}`,
    radius,
    type: 'cafe',
    keyword,
    key: apiKey
  };

  const response = await axios.get(`${GOOGLE_BASE_URL}/place/nearbysearch/json`, { params });

  if (response.data.status === 'ZERO_RESULTS') {
    return { cafes: [], searchCenter: { lat, lng } };
  }

  if (response.data.status !== 'OK') {
    throw new Error(response.data.error_message || `Nearby search failed with status: ${response.data.status}`);
  }

  const cafes = response.data.results.map((place) => normalizePlace(place, lat, lng));

  return {
    cafes,
    searchCenter: { lat, lng },
    next_page_token: response.data.next_page_token || null
  };
};

/**
 * Fetch detailed place info from Google Place Details API
 */
export const getPlaceDetails = async (placeId, userLat = null, userLng = null) => {
  const apiKey = getApiKey();

  const fields = [
    'place_id',
    'name',
    'rating',
    'user_ratings_total',
    'price_level',
    'formatted_address',
    'formatted_phone_number',
    'international_phone_number',
    'website',
    'opening_hours',
    'geometry',
    'photos',
    'url',
    'types',
    'reviews',
    'vicinity'
  ].join(',');

  const response = await axios.get(`${GOOGLE_BASE_URL}/place/details/json`, {
    params: {
      place_id: placeId,
      fields,
      key: apiKey
    }
  });

  if (response.data.status === 'NOT_FOUND' || response.data.status === 'ZERO_RESULTS') {
    return null;
  }

  if (response.data.status !== 'OK') {
    throw new Error(response.data.error_message || `Place details failed with status: ${response.data.status}`);
  }

  return normalizePlace(response.data.result, userLat, userLng);
};

/**
 * Proxy Google Place Photo stream so frontend does not need direct API key exposure
 */
export const getPhotoStream = async (photoReference, maxWidth = 800) => {
  const apiKey = getApiKey();

  const photoUrl = `${GOOGLE_BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${encodeURIComponent(photoReference)}&key=${apiKey}`;

  return axios.get(photoUrl, {
    responseType: 'stream'
  });
};
