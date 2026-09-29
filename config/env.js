import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'cafe_finder_super_secret_jwt_key_2026',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export const validateEnv = () => {
  const missing = [];
  if (!ENV.GOOGLE_PLACES_API_KEY && !ENV.GOOGLE_MAPS_API_KEY) {
    missing.push('GOOGLE_PLACES_API_KEY (or GOOGLE_MAPS_API_KEY)');
  }
  if (!ENV.SUPABASE_URL) {
    missing.push('SUPABASE_URL');
  }
  if (!ENV.SUPABASE_ANON_KEY) {
    missing.push('SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    console.warn(`[WARN] Missing environment variables in backend: ${missing.join(', ')}.`);
    console.warn('[WARN] Please set these in backend/.env for full Google Places and Supabase functionality.');
  }
};
