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

-- Allow full access (admin dashboard uses anon key with this policy)
CREATE POLICY "Admin full access" ON public.repair_jobs
    USING (true)
    WITH CHECK (true);
