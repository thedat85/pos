import { useState, useCallback } from 'react';
import type { Order } from '../types';
import { orderService } from '../services/orderService';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (params?: { status?: string; page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.getAll(params);
      setOrders(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, error, fetchOrders };
}
