// ============================================
// App Constants
// ============================================

export const APP_NAME = 'Amber Hearth';

export const ROLES = {
  WAITER: 'waiter',
  KITCHEN: 'kitchen',
  CASHIER: 'cashier',
  MANAGER: 'manager',
} as const;

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
} as const;

export const ORDER_STATUS = {
  NEW: 'new',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  PREPARING: 'preparing',
  DONE: 'done',
  CLOSED: 'closed',
} as const;

export const ORDER_ITEM_STATUS = {
  NEW: 'new',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'cash',
  QR: 'qr',
} as const;

// Stitch "Tactile Atelier" color tokens
export const STITCH = {
  primary: '#855300',
  primaryContainer: '#f59e0b',  // Hero amber CTA
  secondary: '#7d5725',
  secondaryContainer: '#ffcb8f',
  tertiary: '#00658b',
  tertiaryContainer: '#1abdff',
  surface: '#f8f9fa',
  surfaceLow: '#f3f4f5',
  surfaceLowest: '#ffffff',
  inverseSurface: '#2e3132',
  onSurface: '#191c1d',
  onSurfaceVariant: '#534434',
  error: '#ba1a1a',
  success: '#4ade80',
  primaryFixed: '#ffddb8',
  outlineVariant: 'rgba(83,68,52,0.15)',
};

export const TABLE_STATUS_COLORS: Record<string, string> = {
  available: '#00658b',   // Stitch tertiary
  occupied: '#ffcb8f',    // Stitch secondary-container (warm, not aggressive red)
  reserved: '#ffddb8',    // Stitch primary-fixed
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  sent_to_kitchen: 'Đã gửi bếp',
  preparing: 'Đang làm',
  done: 'Hoàn tất',
  closed: 'Đã đóng',
};

export const ORDER_ITEM_STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  sent_to_kitchen: 'Chờ làm',
  preparing: 'Đang làm',
  completed: 'Xong',
};

export const ROLE_ROUTES: Record<string, string> = {
  waiter: '/waiter/tables',
  kitchen: '/kitchen',
  cashier: '/waiter/tables',
  manager: '/manager/dashboard',
};

export const DEFAULT_PAGE_SIZE = 20;

/**
 * Format order display code.
 * Uses `order_code` (YYMMDD_00001) if available, falls back to
 * generating one from created_at + id.
 */
export function formatOrderCode(order: { order_code?: string | null; id: string; created_at: string }): string {
  if (order.order_code) return order.order_code;
  // Fallback: generate from created_at date + last 5 chars of id
  const d = new Date(order.created_at);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const suffix = order.id.replace(/-/g, '').slice(-5).toUpperCase();
  return `${yy}${mm}${dd}_${suffix}`;
}
