import { createScopedClient, supabaseAdmin } from '../config/supabase.js';

export class HistoryModel {
  static async addSearch(userId, { query, locationName = null, lat = null, lng = null }, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('search_history')
      .insert({
        user_id: userId,
        query,
        location_name: locationName,
        latitude: lat,
        longitude: lng
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getHistory(userId, limit = 20, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async deleteItem(userId, id, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('search_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  }

  static async clearAll(userId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }
}
