import { supabase } from '../lib/supabase';
import { Table } from '../types';

export const tableService = {
  async getAll(filters?: { zone?: string; status?: string }): Promise<Table[]> {
    let query = supabase.from('tables').select('*');

    if (filters?.zone) {
      query = query.eq('zone', filters.zone);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('table_no');

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(data: { table_no: string; capacity: number; zone?: string }): Promise<Table> {
    const { data: created, error } = await supabase
      .from('tables')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async update(id: string, data: Partial<Table>): Promise<Table> {
    const { data: updated, error } = await supabase
      .from('tables')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async remove(id: string): Promise<void> {
    // Check table status is 'available'
    const table = await this.getById(id);
    if (table.status !== 'available') {
      throw new Error('Cannot delete table: status is not available');
    }

    // Check no future reservations exist
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('id')
      .eq('table_id', id)
      .gte('reservation_date', new Date().toISOString())
      .limit(1);

    if (resError) throw resError;
    if (reservations && reservations.length > 0) {
      throw new Error('Cannot delete table: future reservations exist');
    }

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getZones(): Promise<string[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('zone')
      .not('zone', 'is', null);

    if (error) throw error;

    const zones = [...new Set(data.map((row: { zone: string }) => row.zone))];
    return zones;
  },
};
