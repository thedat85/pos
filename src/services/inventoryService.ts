import { supabase } from '../lib/supabase';
import { Ingredient, InventoryImport } from '../types';

export const inventoryService = {
  async getIngredients(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: Ingredient[]; count: number }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to);

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async createIngredient(data: {
    name: string;
    unit: string;
    min_quantity?: number;
  }): Promise<Ingredient> {
    const { data: created, error } = await supabase
      .from('ingredients')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async updateIngredient(
    id: string,
    data: Partial<Ingredient>
  ): Promise<Ingredient> {
    const { data: updated, error } = await supabase
      .from('ingredients')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async removeIngredient(id: string): Promise<void> {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async importStock(data: {
    ingredient_id: string;
    quantity: number;
    supplier?: string;
    unit_price?: number;
  }): Promise<InventoryImport> {
    const { data: created, error } = await supabase
      .from('inventory_imports')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async getImportHistory(params?: {
    ingredient_id?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: InventoryImport[]; count: number }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('inventory_imports')
      .select('*, ingredient:ingredients(*)', { count: 'exact' });

    if (params?.ingredient_id) {
      query = query.eq('ingredient_id', params.ingredient_id);
    }
    if (params?.from) {
      query = query.gte('created_at', params.from);
    }
    if (params?.to) {
      query = query.lte('created_at', params.to);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  },

  async getAlerts(): Promise<Ingredient[]> {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .not('min_quantity', 'is', null)
      .filter('quantity', 'lte', 'min_quantity');

    if (error) throw error;

    // Fallback: client-side filter in case the column-to-column filter is not supported
    if (data) {
      return data.filter(
        (item: Ingredient) =>
          item.min_quantity != null && item.quantity <= item.min_quantity
      );
    }
    return [];
  },

  async getStats(params?: {
    from?: string;
    to?: string;
  }): Promise<{
    total_imports: number;
    total_cost: number;
    unique_ingredients: number;
  }> {
    let query = supabase.from('inventory_imports').select('*');

    if (params?.from) {
      query = query.gte('created_at', params.from);
    }
    if (params?.to) {
      query = query.lte('created_at', params.to);
    }

    const { data, error } = await query;

    if (error) throw error;

    const imports = data ?? [];
    const totalCost = imports.reduce(
      (sum: number, imp: InventoryImport) =>
        sum + (imp.unit_price ?? 0) * imp.quantity,
      0
    );
    const uniqueIngredients = new Set(
      imports.map((imp: InventoryImport) => imp.ingredient_id)
    ).size;

    return {
      total_imports: imports.length,
      total_cost: totalCost,
      unique_ingredients: uniqueIngredients,
    };
  },
};
