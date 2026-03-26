-- ============================================
-- Restaurant POS - Indexes
-- Based on BD Section 8 Performance Requirements
-- ============================================

-- Orders indexes
CREATE INDEX idx_orders_table_status ON public.orders(table_id, status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);

-- Reservations indexes
CREATE UNIQUE INDEX idx_reservations_unique_confirmed
  ON public.reservations(table_id, reservation_date, reservation_time)
  WHERE status = 'confirmed';
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);

-- Menu items indexes
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id)
  WHERE is_deleted = false;
CREATE INDEX idx_menu_items_status ON public.menu_items(status)
  WHERE is_deleted = false;

-- Payments indexes
CREATE INDEX idx_payments_created_at ON public.payments(created_at);
CREATE INDEX idx_payments_method ON public.payments(method);

-- Ingredients alert index
CREATE INDEX idx_ingredients_alert ON public.ingredients(quantity, min_quantity);

-- Users index
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
