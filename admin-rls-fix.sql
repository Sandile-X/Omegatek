-- ============================================================
-- Omegatek Solutions — CRITICAL RLS fix
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- (only once the project is confirmed back online — see audit)
-- ============================================================
--
-- WHAT THIS FIXES
-- Three tables have "admin" policies that don't actually check for
-- an admin — they check for `TO authenticated` (any logged-in user,
-- i.e. any customer who has ever signed up) or, on repair_jobs,
-- nothing at all (`USING (true)` with no role restriction — readable
-- and writable by anyone, including anonymous requests, since the
-- anon key is public and shipped in client-side JS):
--
--   1. public.products      — any signed-up customer can INSERT/UPDATE/DELETE
--                              any product row (edit prices, wipe stock).
--   2. public.blog_posts    — any signed-up customer can create/edit/delete
--                              blog posts and read unpublished drafts.
--   3. public.repair_jobs   — ANYONE, no login required, can read or write
--                              every customer's name/email/phone/device/cost.
--
-- This migration introduces a real admin_users table + is_admin()
-- helper, then re-points all three "admin" policies at it.
--
-- AFTER RUNNING THIS FILE, you still need to add yourself as an
-- admin — see the INSERT at the bottom. Nothing will be able to
-- write to these tables from the admin dashboard until you do.
-- ============================================================

-- ── Step 1: a real admin registry ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       text,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Nobody reads/writes this table directly through the API — only the
-- is_admin() function below (SECURITY DEFINER) touches it. Default-deny.
DROP POLICY IF EXISTS "No direct access" ON public.admin_users;
CREATE POLICY "No direct access" ON public.admin_users FOR ALL USING (false);

-- ── Step 2: is_admin() — SECURITY DEFINER so it can read
-- admin_users even though the table itself denies direct access ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    );
$$;

-- ── Step 3: products — replace the open policy ─────────────────
DROP POLICY IF EXISTS "Admin full access" ON public.products;
CREATE POLICY "Admin full access"
    ON public.products FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
-- "Public read products" (SELECT USING TRUE) is intentional and left as-is.

-- ── Step 4: blog_posts — replace all three admin policies ──────
DROP POLICY IF EXISTS "Admin read all posts" ON public.blog_posts;
CREATE POLICY "Admin read all posts"
    ON public.blog_posts FOR SELECT
    USING (is_admin());

DROP POLICY IF EXISTS "Admin insert posts" ON public.blog_posts;
CREATE POLICY "Admin insert posts"
    ON public.blog_posts FOR INSERT
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin update posts" ON public.blog_posts;
CREATE POLICY "Admin update posts"
    ON public.blog_posts FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin delete posts" ON public.blog_posts;
CREATE POLICY "Admin delete posts"
    ON public.blog_posts FOR DELETE
    USING (is_admin());
-- "Public read published posts" (SELECT USING published = true) is
-- intentional and left as-is.

-- ── Step 5: repair_jobs — this was the worst one (no auth at all) ──
DROP POLICY IF EXISTS "Admin full access" ON public.repair_jobs;
CREATE POLICY "Admin full access"
    ON public.repair_jobs FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());

-- ============================================================
-- Step 6 — REQUIRED: register your admin account(s).
--
-- Find your user UUID in: Supabase Dashboard → Authentication →
-- Users → click your admin email → copy the "User UID" field.
-- Then run (repeat per admin):
--
--   INSERT INTO public.admin_users (id, email)
--   VALUES ('paste-your-user-uuid-here', 'your-admin-email@example.com');
--
-- Until you do this, is_admin() returns false for everyone —
-- including you — and the admin dashboard's product/blog/repair-job
-- writes will fail with a permissions error.
-- ============================================================
