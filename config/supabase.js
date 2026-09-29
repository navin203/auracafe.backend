import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

let supabaseClient = null;
let supabaseAdmin = null;

if (ENV.SUPABASE_URL && (ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY)) {
  // Public client
  supabaseClient = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY || ENV.SUPABASE_SERVICE_ROLE_KEY);

  // Admin client for backend operations
  const adminKey = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;
  supabaseAdmin = createClient(ENV.SUPABASE_URL, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('[WARN] Supabase credentials not fully configured.');
}

/**
 * Creates an authenticated Supabase client for a specific user request
 * to respect Row Level Security (RLS) policies.
 * @param {string} token - User's JWT bearer token
 */
export const createScopedClient = (token) => {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL and Anon Key are required to create a scoped client.');
  }

  return createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export { supabaseClient, supabaseAdmin };
