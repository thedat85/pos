import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../types';

type KitchenItemStatus = 'preparing' | 'completed';

export const kitchenService = {
  async getKitchenOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), tables(*)')
      .in('status', ['sent_to_kitchen', 'preparing', 'done'])
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get kitchen orders: ${error.message}`);

    // Map Supabase response: order_items → items, tables → table
    return (data ?? []).map((order: Record<string, unknown>) => ({
      ...order,
      items: order.order_items ?? [],
      table: order.tables ?? null,
    })) as Order[];
  },

  async updateItemStatus(itemId: string, status: KitchenItemStatus): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update item status: ${error.message}`);
    return data;
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get order items: ${error.message}`);
    return data ?? [];
  },
};
