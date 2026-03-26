import { supabase } from '../lib/supabase';
import { Order, Payment } from '../types';

interface ProcessPaymentData {
  order_id: string;
  method: string;
  amount: number;
  amount_received?: number;
  change_amount?: number;
  cashier_id: string;
}

interface PaymentHistoryParams {
  from?: string;
  to?: string;
  method?: string;
  page?: number;
  limit?: number;
}

interface OrderTotals {
  subtotal: number;
  tax: number;
  service_fee: number;
  total: number;
}

export const paymentService = {
  async calculateTotal(orderId: string): Promise<OrderTotals> {
    const { data, error } = await supabase
      .from('orders')
      .select('subtotal, tax_amount, service_fee, total')
      .eq('id', orderId)
      .single();

    if (error) throw new Error(`Failed to calculate total: ${error.message}`);
    return {
      subtotal: data.subtotal,
      tax: data.tax_amount,
      service_fee: data.service_fee,
      total: data.total,
    };
  },

  async processPayment(data: ProcessPaymentData): Promise<Payment> {
    const change_amount = data.method === 'cash'
      ? Math.max(0, (data.amount_received ?? data.amount) - data.amount)
      : 0;

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: data.order_id,
        method: data.method,
        amount: data.amount,
        amount_received: data.amount_received,
        change_amount: data.change_amount ?? change_amount,
        cashier_id: data.cashier_id,
      })
      .select()
      .single();

    if (paymentError) throw new Error(`Failed to process payment: ${paymentError.message}`);

    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'closed' })
      .eq('id', data.order_id);

    if (orderError) throw new Error(`Failed to close order: ${orderError.message}`);

    return payment;
  },

  generateQR(orderId: string, amount: number): string {
    const bankId = 'MB';
    const accountNo = '0382195135';
    const template = 'compact2';
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=Order${orderId}`;
  },

  async getInvoice(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), payments(*), tables(*)')
      .eq('id', orderId)
      .single();

    if (error) throw new Error(`Failed to get invoice: ${error.message}`);
    const raw = data as Record<string, unknown>;
    return { ...raw, items: raw.order_items ?? [], table: raw.tables ?? null, payment: raw.payments ?? null } as unknown as Order;
  },

  async getHistory(params?: PaymentHistoryParams): Promise<{ data: Payment[]; count: number }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('payments')
      .select('*, orders(*), users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params?.method) {
      query = query.eq('method', params.method);
    }

    if (params?.from) {
      query = query.gte('created_at', params.from);
    }

    if (params?.to) {
      query = query.lte('created_at', params.to);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get payment history: ${error.message}`);
    return { data: data ?? [], count: count ?? 0 };
  },
};
