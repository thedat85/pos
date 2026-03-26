import { supabase } from '../lib/supabase';

interface RevenueResult {
  total_revenue: number;
  total_orders: number;
  avg_per_order: number;
}

interface DailyRevenueItem {
  date: string;
  revenue: number;
  orders: number;
}

interface TopItem {
  item_name: string;
  quantity: number;
  revenue: number;
}

interface ExportData {
  summary: RevenueResult;
  daily: DailyRevenueItem[];
  topItems: TopItem[];
  period: { from: string; to: string };
}

export const reportService = {
  async getRevenue(from: string, to: string): Promise<RevenueResult> {
    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .eq('status', 'closed')
      .gte('created_at', from)
      .lte('created_at', to);

    if (error) throw error;

    const orders = data ?? [];
    const totalRevenue = orders.reduce(
      (sum: number, order: { total: number }) => sum + order.total,
      0
    );
    const totalOrders = orders.length;
    const avgPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      avg_per_order: Math.round(avgPerOrder * 100) / 100,
    };
  },

  async getDailyRevenue(
    from: string,
    to: string
  ): Promise<DailyRevenueItem[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'closed')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at');

    if (error) throw error;

    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    (data ?? []).forEach((order: { total: number; created_at: string }) => {
      const date = order.created_at.split('T')[0];
      const existing = dailyMap.get(date) ?? { revenue: 0, orders: 0 };
      existing.revenue += order.total;
      existing.orders += 1;
      dailyMap.set(date, existing);
    });

    const result: DailyRevenueItem[] = [];
    dailyMap.forEach((value, date) => {
      result.push({ date, revenue: value.revenue, orders: value.orders });
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  },

  async getTopItems(
    from: string,
    to: string,
    limit: number = 10
  ): Promise<TopItem[]> {
    // Get closed orders in date range first, then fetch their items
    const { data: closedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'closed')
      .gte('created_at', from)
      .lte('created_at', to);

    if (ordersError) throw ordersError;

    const orderIds = (closedOrders ?? []).map((o: { id: string }) => o.id);
    if (orderIds.length === 0) return [];

    const { data, error } = await supabase
      .from('order_items')
      .select('item_name, quantity, item_price')
      .in('order_id', orderIds);

    if (error) throw error;

    const itemMap = new Map<string, { quantity: number; revenue: number }>();

    (data ?? []).forEach(
      (item: { item_name: string; quantity: number; item_price: number }) => {
        const existing = itemMap.get(item.item_name) ?? {
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.item_price;
        itemMap.set(item.item_name, existing);
      }
    );

    const result: TopItem[] = [];
    itemMap.forEach((value, item_name) => {
      result.push({
        item_name,
        quantity: value.quantity,
        revenue: value.revenue,
      });
    });

    return result
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  },

  async exportReport(from: string, to: string): Promise<ExportData> {
    const [summary, daily, topItems] = await Promise.all([
      this.getRevenue(from, to),
      this.getDailyRevenue(from, to),
      this.getTopItems(from, to),
    ]);

    return {
      summary,
      daily,
      topItems,
      period: { from, to },
    };
  },
};
