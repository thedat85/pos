-- ============================================
-- Restaurant POS - Database Schema
-- Supabase-compatible PostgreSQL
-- Based on BD_POS_Restaurant v1.0 Section 6
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. users
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('waiter', 'kitchen', 'cashier', 'manager')),
  is_active BOOLEAN DEFAULT true,
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. tables (restaurant tables)
-- ============================================
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_no VARCHAR(10) UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity >= 1),
  zone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved')),
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. reservations
-- ============================================
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size >= 1),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  note TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. categories
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. menu_items
-- ============================================
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  category_id UUID REFERENCES public.categories(id),
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock')),
  is_deleted BOOLEAN DEFAULT false,
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. orders
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES public.tables(id),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'sent_to_kitchen', 'preparing', 'done', 'closed')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  service_fee DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  created_by UUID REFERENCES public.users(id),
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. order_items
-- ============================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id),
  item_name VARCHAR(200) NOT NULL,
  item_price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'sent_to_kitchen', 'preparing', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. payments
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id),
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'qr')),
  amount DECIMAL(12,2) NOT NULL,
  amount_received DECIMAL(12,2),
  change_amount DECIMAL(12,2),
  cashier_id UUID REFERENCES public.users(id),
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. ingredients
-- ============================================
CREATE TABLE public.ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  quantity DECIMAL(12,3) DEFAULT 0,
  min_quantity DECIMAL(12,3) DEFAULT 0,
  branch_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. inventory_imports
-- ============================================
CREATE TABLE public.inventory_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES public.ingredients(id),
  quantity DECIMAL(12,3) NOT NULL CHECK (quantity > 0),
  supplier VARCHAR(200),
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2),
  imported_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. payment_config (singleton)
-- ============================================
CREATE TABLE public.payment_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name VARCHAR(100) DEFAULT '',
  account_number VARCHAR(50) DEFAULT '',
  account_name VARCHAR(100) DEFAULT '',
  qr_template TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. system_config (key-value)
-- ============================================
CREATE TABLE public.system_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description VARCHAR(200),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for order-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- ============================================
-- Storage: menu-images bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('menu-images', 'menu-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read, authenticated upload/update/delete
CREATE POLICY "menu-images allow public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "menu-images allow auth upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "menu-images allow auth update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "menu-images allow auth delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);
