-- ============================================================
-- Omegatek Solutions — repair_jobs table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.repair_jobs (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name       text NOT NULL,
    customer_email      text,
    customer_phone      text,
    device_type         text,
    device_model        text,
    problem_description text NOT NULL,
    status              text DEFAULT 'received'
                        CHECK (status IN ('received','diagnosed','in_progress','ready','collected','cancelled')),
    technician_notes    text,
    estimated_cost      numeric(10,2),
    actual_cost         numeric(10,2),
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.repair_jobs ENABLE ROW LEVEL SECURITY;

-- Admin registry + helper (idempotent — safe if already created by another
-- schema file). IMPORTANT: this table holds customer PII (name/email/phone/
-- device/cost) — "USING (true)" with no role check means anyone with the
-- public anon key can read or write every row with no login at all.
CREATE TABLE IF NOT EXISTS public.admin_users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       text,
    created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No direct access" ON public.admin_users;
CREATE POLICY "No direct access" ON public.admin_users FOR ALL USING (false);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()) $$;

-- Only real admins can read/write repair jobs
CREATE POLICY "Admin full access" ON public.repair_jobs
    USING (is_admin())
    WITH CHECK (is_admin());

-- After running this file: add yourself —
--   INSERT INTO public.admin_users (id, email) VALUES ('<your-auth-uid>', '<your-email>');
