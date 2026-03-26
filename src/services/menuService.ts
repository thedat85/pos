import { supabase } from '../lib/supabase';
import { Category, MenuItem } from '../types';

export const menuService = {
  categories: {
    async getAll(): Promise<Category[]> {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data;
    },

    async create(data: { name: string; sort_order?: number }): Promise<Category> {
      const { data: created, error } = await supabase
        .from('categories')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return created;
    },

    async update(id: string, data: Partial<Category>): Promise<Category> {
      const { data: updated, error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },

    async remove(id: string): Promise<void> {
      // Check no menu items belong to this category
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id')
        .eq('category_id', id)
        .eq('is_deleted', false)
        .limit(1);

      if (itemsError) throw itemsError;
      if (items && items.length > 0) {
        throw new Error('Cannot delete category: menu items still belong to it');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  },

  items: {
    async getAll(filters?: {
      category_id?: string;
      status?: string;
      search?: string;
    }): Promise<MenuItem[]> {
      let query = supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .eq('is_deleted', false);

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data;
    },

    async getById(id: string): Promise<MenuItem> {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async create(data: {
      name: string;
      price: number;
      category_id: string;
      status?: string;
    }): Promise<MenuItem> {
      const { data: created, error } = await supabase
        .from('menu_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return created;
    },

    async update(id: string, data: Partial<MenuItem>): Promise<MenuItem> {
      const { data: updated, error } = await supabase
        .from('menu_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },

    async remove(id: string): Promise<void> {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
    },

    async toggleStatus(
      id: string,
      status: 'available' | 'out_of_stock'
    ): Promise<MenuItem> {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async uploadImage(id: string, file: File): Promise<MenuItem> {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}_${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      const { data: updated, error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: urlData.publicUrl })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    },
  },
};
