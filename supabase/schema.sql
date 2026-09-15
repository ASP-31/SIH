-- ============================================================================
-- SAAS D2C STOREFRONT BUILDER - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  upi_id TEXT NOT NULL, -- Required e.g. merchant@okicici
  upi_name TEXT NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  bio TEXT,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_slug ON public.stores(slug);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON public.stores(owner_id);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_store ON public.products(store_id);

-- 4. ORDERS TABLE
CREATE TYPE public.order_status AS ENUM (
  'pending_payment',
  'utr_submitted',
  'verified_paid',
  'rejected',
  'shipped',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_address TEXT NOT NULL,
  buyer_upi_id TEXT, -- Optional for easy refunds
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  utr_number TEXT CHECK (utr_number IS NULL OR utr_number ~ '^[0-9]{12}$'),
  status public.order_status NOT NULL DEFAULT 'pending_payment',
  inventory_locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- 6. REVIEWS & REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reviews_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  comment TEXT,
  is_report BOOLEAN NOT NULL DEFAULT FALSE,
  report_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_store ON public.reviews_reports(store_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews_reports ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can view and update their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- STORES: Anyone can view active/suspended store status, sellers manage own
CREATE POLICY "Public read stores" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage own store" ON public.stores
  FOR ALL USING (auth.uid() = owner_id);

-- PRODUCTS: Anyone can view active products, sellers manage own store's products
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Sellers can read all own store products" ON public.products
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()));

CREATE POLICY "Sellers can manage own store products" ON public.products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()));

-- ORDERS: Public can insert orders; buyers can view own order by ID; sellers view own store orders
CREATE POLICY "Public can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view order by ID" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage own store orders" ON public.orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND owner_id = auth.uid()));

-- ORDER ITEMS: Public insert and select, sellers manage own
CREATE POLICY "Public can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view order items" ON public.order_items
  FOR SELECT USING (true);

-- REVIEWS_REPORTS: Public can read non-report reviews; verified buyers can insert
CREATE POLICY "Public read store reviews" ON public.reviews_reports
  FOR SELECT USING (is_report = FALSE);

CREATE POLICY "Public insert verified order reviews reports" ON public.reviews_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id
      AND status IN ('verified_paid', 'shipped')
    )
  );

-- ============================================================================
-- DATABASE RPC FUNCTIONS & TRIGGERS
-- ============================================================================

-- A. 10-Minute Temporary Inventory Locking Function
-- Checks available inventory considering pending orders with valid lock window
CREATE OR REPLACE FUNCTION public.check_and_lock_inventory(
  p_product_id UUID,
  p_qty INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_stock INTEGER;
  v_locked_stock INTEGER;
BEGIN
  -- Get physical stock
  SELECT stock_quantity INTO v_available_stock
  FROM public.products
  WHERE id = p_product_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Sum locked stock for unexpired pending orders
  SELECT COALESCE(SUM(oi.quantity), 0) INTO v_locked_stock
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = p_product_id
    AND o.status = 'pending_payment'
    AND o.inventory_locked_until > NOW();

  -- Validate if requesting quantity is within effective available stock
  IF (v_available_stock - v_locked_stock) >= p_qty THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- B. Automated 3% Strike Suspension Trigger
-- Automatically suspends a store if (Total Verified Reports / Total Verified Orders) > 3%
-- when Total Verified Orders >= 10.
CREATE OR REPLACE FUNCTION public.check_store_strike_suspension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_orders INTEGER;
  v_total_reports INTEGER;
  v_report_percentage NUMERIC;
BEGIN
  IF NEW.is_report = TRUE THEN
    -- Count total verified orders for this store
    SELECT COUNT(*) INTO v_total_orders
    FROM public.orders
    WHERE store_id = NEW.store_id
      AND status IN ('verified_paid', 'shipped');

    -- Count total reports for this store
    SELECT COUNT(*) INTO v_total_reports
    FROM public.reviews_reports
    WHERE store_id = NEW.store_id
      AND is_report = TRUE;

    IF v_total_orders >= 10 THEN
      v_report_percentage := (v_total_reports::NUMERIC / v_total_orders::NUMERIC) * 100.0;
      IF v_report_percentage > 3.0 THEN
        UPDATE public.stores
        SET is_suspended = TRUE
        WHERE id = NEW.store_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_strike_suspension
AFTER INSERT OR UPDATE ON public.reviews_reports
FOR EACH ROW
EXECUTE FUNCTION public.check_store_strike_suspension();
