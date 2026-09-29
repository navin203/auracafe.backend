import { createScopedClient, supabaseAdmin } from '../config/supabase.js';

export class FavoriteModel {
  static async addFavorite(userId, cafe, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const payload = {
      user_id: userId,
      place_id: cafe.place_id,
      cafe_name: cafe.name,
      cafe_address: cafe.address || null,
      rating: cafe.rating || null,
      user_ratings_total: cafe.user_ratings_total || null,
      price_level: cafe.price_level || null,
      photo_reference: cafe.photos?.[0]?.photo_reference || null,
      latitude: cafe.location?.lat || null,
      longitude: cafe.location?.lng || null
    };

    const { data, error } = await client
      .from('favorites')
      .upsert(payload, { onConflict: 'user_id,place_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getFavorites(userId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async removeFavorite(userId, placeId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .select();

    if (error) throw error;
    return data;
  }

  static async isFavorite(userId, placeId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }
}
