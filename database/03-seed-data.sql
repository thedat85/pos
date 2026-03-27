-- ============================================
-- Restaurant POS - Seed Data
-- Synced with production database 2026-03-26
-- ============================================

-- System config defaults (BD Section 6.2)
INSERT INTO public.system_config (key, value, description) VALUES
  ('tax_percent', '10', 'Thuế VAT (%)'),
  ('service_fee_percent', '5', 'Phí dịch vụ (%)'),
  ('min_reservation_minutes', '30', 'Đặt bàn trước tối thiểu (phút)'),
  ('allow_incomplete_payment', 'false', 'Cho phép thanh toán order chưa Done')
ON CONFLICT (key) DO NOTHING;

-- Default payment config
INSERT INTO public.payment_config (bank_name, account_number, account_name)
VALUES ('Vietcombank', '', '')
ON CONFLICT DO NOTHING;

-- Sample categories
INSERT INTO public.categories (name, sort_order) VALUES
  ('Khai vị', 1),
  ('Món chính', 2),
  ('Lẩu & Nướng', 3),
  ('Cơm', 4),
  ('Tráng miệng', 5),
  ('Đồ uống', 6);

-- Sample tables (12 bàn, 3 zone)
INSERT INTO public.tables (table_no, capacity, zone) VALUES
  ('T01', 2, 'Tầng 1'),
  ('T02', 2, 'Tầng 1'),
  ('T03', 4, 'Tầng 1'),
  ('T04', 4, 'Tầng 1'),
  ('T05', 6, 'Tầng 1'),
  ('T06', 6, 'Tầng 1'),
  ('T07', 4, 'Sân vườn'),
  ('T08', 4, 'Sân vườn'),
  ('T09', 8, 'Sân vườn'),
  ('T10', 10, 'VIP'),
  ('T11', 12, 'VIP'),
  ('T12', 20, 'VIP');

-- Sample menu items
INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Gỏi cuốn tôm thịt', 45000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Khai vị';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Nem rán', 55000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Khai vị';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Bò lúc lắc', 185000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Món chính';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Cá chép om dưa', 165000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Món chính';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Tôm rang muối', 195000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Món chính';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Lẩu Thái hải sản', 350000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Lẩu & Nướng';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Cơm chiên dương châu', 65000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Cơm';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Chè khúc bạch', 35000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Tráng miệng';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Trà đá', 10000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Đồ uống';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Nước ngọt', 20000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Đồ uống';

INSERT INTO public.menu_items (name, price, category_id, status)
SELECT 'Bia Saigon', 25000, c.id, 'available'
FROM public.categories c WHERE c.name = 'Đồ uống';

-- Sample ingredients
INSERT INTO public.ingredients (name, unit, quantity, min_quantity) VALUES
  ('Gạo', 'kg', 50, 10),
  ('Thịt bò', 'kg', 20, 5),
  ('Thịt heo', 'kg', 30, 5),
  ('Tôm', 'kg', 15, 3),
  ('Cá', 'kg', 10, 3),
  ('Rau xanh', 'kg', 20, 5),
  ('Dầu ăn', 'lít', 20, 5),
  ('Nước mắm', 'lít', 10, 3),
  ('Bia Saigon', 'thùng', 10, 3),
  ('Nước ngọt', 'thùng', 8, 2);

-- ============================================
-- Default Users (tạo qua Supabase Auth API)
-- ============================================
-- Để tạo users, chạy script migrate.py hoặc tạo thủ công:
--
-- | Role    | Username   | Email              | Password    |
-- |---------|------------|--------------------|-------------|
-- | Manager | manager    | quanly@pos.com     | Manager@123 |
-- | Waiter  | waiter01   | boiban@pos.com     | Test@123    |
-- | Kitchen | kitchen01  | bep@pos.com        | Test@123    |
-- | Cashier | cashier01  | thungan@pos.com    | Test@123    |
--
-- Sau khi tạo auth user, INSERT vào public.users:
-- INSERT INTO public.users (auth_id, username, full_name, role, is_active)
-- VALUES ('<auth-uuid>', '<username>', '<full_name>', '<role>', true);
