// ============================================
// FN-01: Reservation Management Service
// ============================================

import { supabase } from '../lib/supabase';
import type { Reservation, Table } from '../types';

interface CreateReservationData {
  table_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  customer_name?: string;
  customer_phone?: string;
  note?: string;
}

interface UpdateReservationData {
  table_id?: string;
  reservation_date?: string;
  reservation_time?: string;
  party_size?: number;
  customer_name?: string;
  customer_phone?: string;
  note?: string;
}

export const reservationService = {
  /**
   * Get all reservations for a given date, joined with table info.
   */
  async getAll(date: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, table:tables(*), creator:users(*)')
      .eq('reservation_date', date)
      .order('reservation_time', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch reservations: ' + error.message);
    }

    return (data ?? []) as Reservation[];
  },

  /**
   * Get a single reservation by ID with table info.
   */
  async getById(id: string): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, table:tables(*), creator:users(*)')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error('Failed to fetch reservation: ' + error.message);
    }

    return data as Reservation;
  },

  /**
   * Create a new reservation.
   */
  async create(data: CreateReservationData): Promise<Reservation> {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        table_id: data.table_id,
        reservation_date: data.reservation_date,
        reservation_time: data.reservation_time,
        party_size: data.party_size,
        customer_name: data.customer_name ?? null,
        customer_phone: data.customer_phone ?? null,
        note: data.note ?? null,
        status: 'confirmed' as const,
      })
      .select('*, table:tables(*)')
      .single();

    if (error) {
      throw new Error('Failed to create reservation: ' + error.message);
    }

    return reservation as Reservation;
  },

  /**
   * Update an existing reservation.
   */
  async update(id: string, data: UpdateReservationData): Promise<Reservation> {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, table:tables(*)')
      .single();

    if (error) {
      throw new Error('Failed to update reservation: ' + error.message);
    }

    return reservation as Reservation;
  },

  /**
   * Cancel a reservation by setting its status to 'cancelled'.
   */
  async cancel(id: string): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled' as const,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, table:tables(*)')
      .single();

    if (error) {
      throw new Error('Failed to cancel reservation: ' + error.message);
    }

    return data as Reservation;
  },

  /**
   * Find tables that are available for a given date, time, and party size.
   * A table is available if:
   *   1. Its capacity >= partySize
   *   2. It has no confirmed reservation at the specified date/time
   */
  async getAvailableTables(
    date: string,
    time: string,
    partySize: number,
  ): Promise<Table[]> {
    // Step 1: Get IDs of tables that already have a confirmed reservation at this date/time
    const { data: reserved, error: reservedError } = await supabase
      .from('reservations')
      .select('table_id')
      .eq('reservation_date', date)
      .eq('reservation_time', time)
      .eq('status', 'confirmed');

    if (reservedError) {
      throw new Error(
        'Failed to check reserved tables: ' + reservedError.message,
      );
    }

    const reservedTableIds = (reserved ?? []).map((r) => r.table_id);

    // Step 2: Get all tables with sufficient capacity, excluding reserved ones
    let query = supabase
      .from('tables')
      .select('*')
      .gte('capacity', partySize)
      .order('table_no', { ascending: true });

    if (reservedTableIds.length > 0) {
      // Filter out tables that are already reserved
      query = query.not('id', 'in', `(${reservedTableIds.join(',')})`);
    }

    const { data: tables, error: tablesError } = await query;

    if (tablesError) {
      throw new Error(
        'Failed to fetch available tables: ' + tablesError.message,
      );
    }

    return (tables ?? []) as Table[];
  },
};
