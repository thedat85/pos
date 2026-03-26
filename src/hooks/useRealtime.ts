import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type EventCallback = (payload: Record<string, unknown>) => void;

// Subscribe to Supabase Realtime changes on a table
export function useRealtimeTable(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: EventCallback,
  filter?: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channelName = `realtime-${table}-${event}-${filter || 'all'}`;

    const channelConfig: Record<string, unknown> = {
      event,
      schema: 'public',
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    channelRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig as never, (payload: Record<string, unknown>) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [table, event, filter, callback]);
}

// Subscribe to order-related changes for Kitchen Display
export function useKitchenRealtime(onOrderChange: () => void) {
  useRealtimeTable('orders', '*', onOrderChange, 'status=in.(sent_to_kitchen,preparing,done)');
  useRealtimeTable('order_items', '*', onOrderChange);
}

// Subscribe to table status changes
export function useTableRealtime(onTableChange: () => void) {
  useRealtimeTable('tables', 'UPDATE', onTableChange);
}
