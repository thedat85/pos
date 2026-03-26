import { supabase } from '../lib/supabase';
import { Order, OrderItem } from '../types';

interface AddItemData {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

interface GetAllParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const orderService = {
  async create(tableId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert({ table_id: tableId, status: 'new' })
      .select()
      .single();

    if (error) throw new Error(`Failed to create order: ${error.message}`);
    return data;
  },

  async getById(id: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), tables(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to get order: ${error.message}`);
    const raw = data as Record<string, unknown>;
    return { ...raw, items: raw.order_items ?? [], table: raw.tables ?? null } as Order;
  },

  async getActiveByTable(tableId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), tables(*)')
      .eq('table_id', tableId)
      .neq('status', 'closed')
      .maybeSingle();

    if (error) throw new Error(`Failed to get active order: ${error.message}`);
    if (!data) return null;
    const raw = data as Record<string, unknown>;
    return { ...raw, items: raw.order_items ?? [], table: raw.tables ?? null } as Order;
  },

  async addItem(orderId: string, data: AddItemData): Promise<OrderItem> {
    const { data: item, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        menu_item_id: data.menu_item_id,
        item_name: data.item_name,
        item_price: data.item_price,
        quantity: data.quantity,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add item: ${error.message}`);
    return item;
  },

  async updateItemQuantity(itemId: string, quantity: number): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update item quantity: ${error.message}`);
    return data;
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (error) throw new Error(`Failed to remove item: ${error.message}`);
  },

  async sendToKitchen(orderId: string): Promise<Order> {
    // Update only items with status='new' → 'sent_to_kitchen'
    const { error: itemsError } = await supabase
      .from('order_items')
      .update({ status: 'sent_to_kitchen' })
      .eq('order_id', orderId)
      .eq('status', 'new');

    if (itemsError) throw new Error(`Failed to update items status: ${itemsError.message}`);

    // Set order status: if currently 'new', change to 'sent_to_kitchen'
    // If already 'sent_to_kitchen' or 'preparing', keep as-is (new items added)
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    const newStatus = currentOrder?.status === 'new' ? 'sent_to_kitchen' : currentOrder?.status;

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw new Error(`Failed to send order to kitchen: ${error.message}`);
    return data;
  },

  async getAll(params?: GetAllParams): Promise<{ data: Order[]; count: number }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('orders')
      .select('*, tables(*), order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get orders: ${error.message}`);
    const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
      ...row,
      items: row.order_items ?? [],
      table: row.tables ?? null,
    })) as Order[];
    return { data: mapped, count: count ?? 0 };
  },
};
