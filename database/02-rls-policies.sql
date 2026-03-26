-- ============================================
-- Restaurant POS - Row Level Security Policies
-- Synced with production database 2026-03-26
-- Cashier has waiter-level access + payment
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper functions
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- users: All authenticated can read, manager can write
-- ============================================
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_insert" ON public.users
  FOR INSERT WITH CHECK (get_user_role() = 'manager');

CREATE POLICY "users_update" ON public.users
  FOR UPDATE USING (get_user_role() = 'manager');

-- ============================================
-- tables: All can read, manager can create/delete, all authenticated can update (status changes)
-- ============================================
CREATE POLICY "tables_select" ON public.tables
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "tables_insert" ON public.tables
  FOR INSERT WITH CHECK (get_user_role() = 'manager');

CREATE POLICY "tables_update" ON public.tables
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "tables_delete" ON public.tables
  FOR DELETE USING (get_user_role() = 'manager');

-- ============================================
-- reservations: Waiter + Cashier + Manager can CRUD
-- ============================================
CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "reservations_insert" ON public.reservations
  FOR INSERT WITH CHECK (get_user_role() IN ('waiter', 'cashier', 'manager'));

CREATE POLICY "reservations_update" ON public.reservations
  FOR UPDATE USING (get_user_role() IN ('waiter', 'cashier', 'manager'));

-- ============================================
-- categories: All can read, manager can write
-- ============================================
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_all" ON public.categories
  FOR ALL USING (get_user_role() = 'manager');

-- ============================================
-- menu_items: All can read, manager can write
-- ============================================
CREATE POLICY "menu_items_select" ON public.menu_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "menu_items_all" ON public.menu_items
  FOR ALL USING (get_user_role() = 'manager');

-- ============================================
-- orders: All authenticated can read/update
--         Waiter + Cashier + Manager can create
-- ============================================
CREATE POLICY "orders_select" ON public.orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "orders_insert" ON public.orders
  FOR INSERT WITH CHECK (get_user_role() IN ('waiter', 'cashier', 'manager'));

CREATE POLICY "orders_update" ON public.orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- order_items: All can read, waiter/cashier/manager create/delete, all update
-- ============================================
CREATE POLICY "order_items_select" ON public.order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_insert" ON public.order_items
  FOR INSERT WITH CHECK (get_user_role() IN ('waiter', 'cashier', 'manager'));

CREATE POLICY "order_items_update" ON public.order_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "order_items_delete" ON public.order_items
  FOR DELETE USING (get_user_role() IN ('waiter', 'cashier', 'manager'));

-- ============================================
-- payments: Cashier + Manager can CRUD
-- ============================================
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (get_user_role() IN ('cashier', 'manager'));

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (get_user_role() IN ('cashier', 'manager'));

-- ============================================
-- ingredients: Manager can CRUD
-- ============================================
CREATE POLICY "ingredients_select" ON public.ingredients
  FOR SELECT USING (get_user_role() = 'manager');

CREATE POLICY "ingredients_all" ON public.ingredients
  FOR ALL USING (get_user_role() = 'manager');

-- ============================================
-- inventory_imports: Manager can CRUD
-- ============================================
CREATE POLICY "inventory_imports_select" ON public.inventory_imports
  FOR SELECT USING (get_user_role() = 'manager');

CREATE POLICY "inventory_imports_insert" ON public.inventory_imports
  FOR INSERT WITH CHECK (get_user_role() = 'manager');

-- ============================================
-- payment_config: Cashier + Manager read, Manager write
-- ============================================
CREATE POLICY "payment_config_select" ON public.payment_config
  FOR SELECT USING (get_user_role() IN ('cashier', 'manager'));

CREATE POLICY "payment_config_update" ON public.payment_config
  FOR UPDATE USING (get_user_role() = 'manager');

-- ============================================
-- system_config: All can read, manager can write
-- ============================================
CREATE POLICY "system_config_select" ON public.system_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "system_config_update" ON public.system_config
  FOR UPDATE USING (get_user_role() = 'manager');
