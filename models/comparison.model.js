import { createScopedClient, supabaseAdmin } from '../config/supabase.js';

export class ComparisonModel {
  static async createComparison(userId, { title, preference = 'default', notes = null, cafes = [] }, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    // 1. Insert parent comparison
    const { data: comparison, error: compError } = await client
      .from('saved_comparisons')
      .insert({
        user_id: userId,
        title,
        preference,
        notes
      })
      .select()
      .single();

    if (compError) throw compError;

    // 2. Insert comparison cafes if any
    if (cafes.length > 0) {
      const cafeRecords = cafes.map(cafe => ({
        comparison_id: comparison.id,
        place_id: cafe.place_id,
        cafe_name: cafe.name,
        rating: cafe.rating || null,
        reviews_count: cafe.user_ratings_total || null,
        price_level: cafe.price_level || null,
        address: cafe.address || null
      }));

      const { error: cafesError } = await client
        .from('comparison_cafes')
        .insert(cafeRecords);

      if (cafesError) throw cafesError;
    }

    return comparison;
  }

  static async getComparisons(userId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('saved_comparisons')
      .select(`
        *,
        comparison_cafes (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(userId, comparisonId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('saved_comparisons')
      .select(`
        *,
        comparison_cafes (*)
      `)
      .eq('id', comparisonId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteComparison(userId, comparisonId, token) {
    const client = token ? createScopedClient(token) : supabaseAdmin;

    const { data, error } = await client
      .from('saved_comparisons')
      .delete()
      .eq('id', comparisonId)
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  }
}
