// ============================================
// Restaurant POS - Database Types
// Auto-generated from BD Section 6.2
// ============================================

export type UserRole = 'waiter' | 'kitchen' | 'cashier' | 'manager';
export type TableStatus = 'available' | 'occupied' | 'reserved';
export type ReservationStatus = 'confirmed' | 'cancelled';
export type MenuItemStatus = 'available' | 'out_of_stock';
export type OrderStatus = 'new' | 'sent_to_kitchen' | 'preparing' | 'done' | 'closed';
export type OrderItemStatus = 'new' | 'sent_to_kitchen' | 'preparing' | 'completed';
export type PaymentMethod = 'cash' | 'qr';

export interface User {
  id: string;
  auth_id: string | null;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  branch_id: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  table_no: string;
  capacity: number;
  zone: string | null;
  status: TableStatus;
  branch_id: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  table_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: ReservationStatus;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  table?: Table;
  creator?: User;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  status: MenuItemStatus;
  is_deleted: boolean;
  branch_id: number;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
}

export interface Order {
  id: string;
  table_id: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  service_fee: number;
  total: number;
  created_by: string | null;
  branch_id: number;
  created_at: string;
  updated_at: string;
  // Joined
  table?: Table;
  creator?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  item_price: number;
  quantity: number;
  status: OrderItemStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: number;
  amount_received: number | null;
  change_amount: number | null;
  cashier_id: string | null;
  branch_id: number;
  created_at: string;
  // Joined
  order?: Order;
  cashier?: User;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  branch_id: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryImport {
  id: string;
  ingredient_id: string;
  quantity: number;
  supplier: string | null;
  unit_price: number | null;
  total_price: number | null;
  imported_by: string | null;
  created_at: string;
  // Joined
  ingredient?: Ingredient;
  importer?: User;
}

export interface PaymentConfig {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_template: string | null;
  updated_at: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface CreateOrderRequest {
  table_id: string;
}

export interface AddOrderItemRequest {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
}

export interface ProcessPaymentRequest {
  order_id: string;
  method: PaymentMethod;
  amount: number;
  amount_received?: number;
}

export interface RevenueReport {
  total_revenue: number;
  total_orders: number;
  avg_per_order: number;
  daily_revenue: { date: string; revenue: number; orders: number }[];
  top_items: { name: string; quantity: number; revenue: number }[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
