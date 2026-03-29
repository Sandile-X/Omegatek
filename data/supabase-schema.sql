-- ============================================================
-- OMEGATEK SOLUTIONS - Supabase Database Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT        NOT NULL,
    first_name  TEXT,
    last_name   TEXT,
    phone       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, phone)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number    TEXT        NOT NULL UNIQUE DEFAULT 'OMG-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8)),
    customer_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email  TEXT        NOT NULL,
    customer_name   TEXT,
    customer_phone  TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','processing','shipped','completed','cancelled')),
    payment_status  TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (payment_status IN ('pending','paid','failed','refunded')),
    payment_method  TEXT,
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_address JSONB,
    notes           TEXT,
    payfast_payment_id TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id      TEXT,
    product_name    TEXT        NOT NULL,
    product_image   TEXT,
    quantity        INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================================
-- 4. REPAIR TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.repair_tickets (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number       TEXT        NOT NULL UNIQUE DEFAULT 'REP-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8)),
    customer_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_email      TEXT        NOT NULL,
    customer_name       TEXT,
    customer_phone      TEXT,
    device_type         TEXT        NOT NULL,   -- e.g. "Laptop", "Smartphone", "Desktop"
    device_brand        TEXT,
    device_model        TEXT,
    issue_description   TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'received'
                                    CHECK (status IN ('received','diagnosed','in_progress','waiting_parts','ready','completed','cancelled')),
    priority            TEXT        NOT NULL DEFAULT 'medium'
                                    CHECK (priority IN ('low','medium','high','urgent')),
    assigned_technician TEXT,
    diagnosis_notes     TEXT,
    estimated_cost      NUMERIC(10,2),
    final_cost          NUMERIC(10,2),
    parts_used          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ
);

CREATE TRIGGER repairs_updated_at
    BEFORE UPDATE ON public.repair_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 5. PRODUCTS (optional - sync with products.json)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id          TEXT        PRIMARY KEY,
    name        TEXT        NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL,
    sale_price  NUMERIC(10,2),
    category    TEXT,
    brand       TEXT,
    stock       INTEGER     NOT NULL DEFAULT 0,
    images      TEXT[],     -- array of image URLs
    tags        TEXT[],
    featured    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Customers can only see their own data
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_tickets  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users read own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ORDERS
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT
    USING (auth.uid() = customer_id OR customer_email = auth.jwt()->>'email');
-- Allow anyone (guest or logged-in) to insert orders; reads are still restricted
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT
    WITH CHECK (true);

-- ORDER ITEMS  
-- Allow anyone to insert order items (restricted by orders table policy at read level)
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT
    WITH CHECK (true);
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT
    USING (order_id IN (SELECT id FROM public.orders WHERE customer_email = auth.jwt()->>'email'));

-- REPAIR TICKETS
CREATE POLICY "Users read own tickets" ON public.repair_tickets FOR SELECT
    USING (auth.uid() = customer_id OR customer_email = auth.jwt()->>'email');
CREATE POLICY "Users create own tickets" ON public.repair_tickets FOR INSERT
    WITH CHECK (customer_email = auth.jwt()->>'email');

-- PRODUCTS (public read)
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (TRUE);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer_email     ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id        ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id      ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_repairs_customer_email    ON public.repair_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_repairs_customer_id       ON public.repair_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_category         ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured         ON public.products(featured);

-- ============================================================
-- DONE. Your Omegatek Supabase schema is ready.
-- ============================================================

-- ============================================================
-- DELETE USER RPC (required for client-side account deletion)
-- Run this separately if you already ran the schema above.
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete profile first (cascade handles orders/repairs via FK)
    DELETE FROM public.profiles WHERE id = auth.uid();
    -- Delete the auth user
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
