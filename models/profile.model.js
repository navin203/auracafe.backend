import { createScopedClient, supabaseAdmin } from '../config/supabase.js';

export class ProfileModel {
  static async getById(userId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async update(userId, updates, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { data, error } = await client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
