-- =============================================================
-- Omegatek Solutions — Newsletter Schema for Supabase
-- Run this once in your Supabase SQL Editor:
-- https://app.supabase.com → SQL Editor → New Query → Paste → Run
-- =============================================================

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    email            TEXT        UNIQUE NOT NULL,
    name             TEXT        NOT NULL DEFAULT '',
    status           TEXT        NOT NULL DEFAULT 'active'
                                 CHECK (status IN ('active', 'unsubscribed')),
    unsubscribe_token TEXT       UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    subscribed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unsubscribed_at  TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Newsletter campaigns
CREATE TABLE IF NOT EXISTS public.newsletters (
    id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    title      TEXT        NOT NULL,
    subject    TEXT        NOT NULL,
    content    TEXT        NOT NULL,
    status     TEXT        NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft', 'sent')),
    sent_at    TIMESTAMPTZ,
    sent_count INTEGER     NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters            ENABLE ROW LEVEL SECURITY;

-- Drop old policies before recreating (safe to re-run)
DROP POLICY IF EXISTS "Admin manage subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin manage newsletters"  ON public.newsletters;
DROP POLICY IF EXISTS "Public can subscribe"      ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Public can unsubscribe"    ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin read subscribers"    ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admin delete subscribers"  ON public.newsletter_subscribers;

-- Public can INSERT to subscribe (PHP validates email + rate-limits)
CREATE POLICY "Public can subscribe"
    ON public.newsletter_subscribers FOR INSERT
    WITH CHECK (true);

-- Public can UPDATE for unsubscribe (PHP validates the 64-char hex token)
CREATE POLICY "Public can unsubscribe"
    ON public.newsletter_subscribers FOR UPDATE
    USING (true) WITH CHECK (true);

-- Authenticated admin can SELECT / DELETE (dashboard & send_newsletter)
CREATE POLICY "Admin read subscribers"
    ON public.newsletter_subscribers FOR SELECT
    USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Admin delete subscribers"
    ON public.newsletter_subscribers FOR DELETE
    USING (auth.role() IN ('authenticated', 'service_role'));

-- Newsletters: authenticated admin can do everything
CREATE POLICY "Admin manage newsletters"
    ON public.newsletters FOR ALL
    USING (auth.role() IN ('authenticated', 'service_role'));

-- ── Secure count function (homepage subscriber counter) ──────────────────
-- Returns active subscriber count without exposing email addresses to anon
CREATE OR REPLACE FUNCTION public.get_active_subscriber_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.newsletter_subscribers WHERE status = 'active';
$$;
GRANT EXECUTE ON FUNCTION public.get_active_subscriber_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_subscriber_count() TO authenticated;
