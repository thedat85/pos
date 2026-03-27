-- ============================================
-- Restaurant POS - Database Functions & Triggers
-- Business logic at DB level
-- ============================================

-- ============================================
-- 0. Auto-generate order_code: YYMMDD_00001
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
  today_prefix TEXT;
  seq_num INTEGER;
BEGIN
  today_prefix := TO_CHAR(NOW(), 'YYMMDD');

  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(order_code, '_', 2), '')::INTEGER
  ), 0) + 1
  INTO seq_num
  FROM public.orders
  WHERE order_code LIKE today_prefix || '_%';

  NEW.order_code := today_prefix || '_' || LPAD(seq_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_code
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_code IS NULL)
  EXECUTE FUNCTION public.generate_order_code();

-- ============================================
-- 1. Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_reservations
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_menu_items
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_order_items
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_ingredients
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 2. BR-01: Only 1 active order per table
-- ============================================
CREATE OR REPLACE FUNCTION public.check_active_order()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE table_id = NEW.table_id
      AND status NOT IN ('closed')
      AND id != COALESCE(NEW.id, uuid_nil())
  ) THEN
    RAISE EXCEPTION 'This table already has an active order'
      USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_active_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.check_active_order();

-- ============================================
-- 3. Auto-check order completion when item status changes
--    When all items = completed → order status = done
-- ============================================
CREATE OR REPLACE FUNCTION public.check_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  incomplete_count INTEGER;
  current_order_status VARCHAR;
BEGIN
  SELECT status INTO current_order_status
  FROM public.orders WHERE id = NEW.order_id;

  IF current_order_status = 'closed' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO incomplete_count
  FROM public.order_items
  WHERE order_id = NEW.order_id AND status != 'completed';

  IF incomplete_count = 0 THEN
    UPDATE public.orders
    SET status = 'done'
    WHERE id = NEW.order_id;
  ELSIF current_order_status NOT IN ('preparing', 'sent_to_kitchen') THEN
    UPDATE public.orders
    SET status = 'preparing'
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_order_done
  AFTER UPDATE OF status ON public.order_items
  FOR EACH ROW
  WHEN (NEW.status IN ('preparing', 'completed'))
  EXECUTE FUNCTION public.check_order_completion();

-- ============================================
-- 4. Auto update order subtotal when items change
-- ============================================
CREATE OR REPLACE FUNCTION public.recalculate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  new_subtotal DECIMAL(12,2);
  tax_pct DECIMAL;
  svc_pct DECIMAL;
BEGIN
  SELECT COALESCE(SUM(item_price * quantity), 0) INTO new_subtotal
  FROM public.order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  SELECT COALESCE(value::DECIMAL, 0) INTO tax_pct
  FROM public.system_config WHERE key = 'tax_percent';

  SELECT COALESCE(value::DECIMAL, 0) INTO svc_pct
  FROM public.system_config WHERE key = 'service_fee_percent';

  UPDATE public.orders SET
    subtotal = new_subtotal,
    tax_amount = ROUND(new_subtotal * tax_pct / 100, 2),
    service_fee = ROUND(new_subtotal * svc_pct / 100, 2),
    total = ROUND(new_subtotal * (1 + tax_pct / 100 + svc_pct / 100), 2)
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_order_on_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

CREATE TRIGGER recalc_order_on_item_update
  AFTER UPDATE OF quantity ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

CREATE TRIGGER recalc_order_on_item_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_order_total();

-- ============================================
-- 5. Auto update table status on order changes
--    BR-07: Table status follows order lifecycle
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_table_status_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' THEN
    UPDATE public.tables SET status = 'available' WHERE id = NEW.table_id;
  ELSIF NEW.status IN ('new', 'sent_to_kitchen', 'preparing', 'done') THEN
    UPDATE public.tables SET status = 'occupied' WHERE id = NEW.table_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_table_on_order_change
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_table_status_on_order();

-- ============================================
-- 6. Auto update ingredient quantity on import
-- ============================================
CREATE OR REPLACE FUNCTION public.update_ingredient_on_import()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.ingredients
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.ingredient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ingredient_import_update
  AFTER INSERT ON public.inventory_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_ingredient_on_import();

-- ============================================
-- 7. Reservation: auto update table status
-- ============================================
CREATE OR REPLACE FUNCTION public.sync_table_on_reservation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' THEN
    UPDATE public.tables SET status = 'reserved' WHERE id = NEW.table_id;
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    -- Only revert if no other confirmed reservations exist for today
    IF NOT EXISTS (
      SELECT 1 FROM public.reservations
      WHERE table_id = NEW.table_id
        AND status = 'confirmed'
        AND id != NEW.id
        AND reservation_date = CURRENT_DATE
    ) THEN
      UPDATE public.tables SET status = 'available' WHERE id = NEW.table_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_table_on_reservation_change
  AFTER INSERT OR UPDATE OF status ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.sync_table_on_reservation();
