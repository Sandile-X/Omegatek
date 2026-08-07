-- =============================================================
-- Omegatek Solutions — Supabase Blog Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================

-- 1. Create the blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    title         text        NOT NULL,
    slug          text        UNIQUE NOT NULL,
    content       text        NOT NULL DEFAULT '',
    excerpt       text        NOT NULL DEFAULT '',
    cover_image   text        NOT NULL DEFAULT '',
    category      text        NOT NULL DEFAULT 'General',
    published     boolean     NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Auto-update `updated_at` on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER set_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Indexes for common queries
CREATE INDEX IF NOT EXISTS blog_posts_slug_idx       ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_published_idx  ON public.blog_posts (published);
CREATE INDEX IF NOT EXISTS blog_posts_created_at_idx ON public.blog_posts (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies

-- Public: anyone can read PUBLISHED posts (e.g. public blog page)
DROP POLICY IF EXISTS "Public read published posts" ON public.blog_posts;
CREATE POLICY "Public read published posts"
    ON public.blog_posts
    FOR SELECT
    USING (published = true);

-- Admin registry + helper (idempotent — safe if already created by another
-- schema file). "TO authenticated" below used to mean "any signed-up
-- customer", not "admin" — these policies now gate on is_admin() instead.
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

-- Admin: real admins can read ALL posts (including drafts)
DROP POLICY IF EXISTS "Admin read all posts" ON public.blog_posts;
CREATE POLICY "Admin read all posts"
    ON public.blog_posts
    FOR SELECT
    USING (is_admin());

-- Admin: real admins can INSERT posts
DROP POLICY IF EXISTS "Admin insert posts" ON public.blog_posts;
CREATE POLICY "Admin insert posts"
    ON public.blog_posts
    FOR INSERT
    WITH CHECK (is_admin());

-- Admin: real admins can UPDATE posts
DROP POLICY IF EXISTS "Admin update posts" ON public.blog_posts;
CREATE POLICY "Admin update posts"
    ON public.blog_posts
    FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

-- Admin: real admins can DELETE posts
DROP POLICY IF EXISTS "Admin delete posts" ON public.blog_posts;
CREATE POLICY "Admin delete posts"
    ON public.blog_posts
    FOR DELETE
    USING (is_admin());

-- After running this file: add yourself —
--   INSERT INTO public.admin_users (id, email) VALUES ('<your-auth-uid>', '<your-email>');

-- =============================================================
-- OPTIONAL: seed one sample post to verify setup
-- =============================================================
-- INSERT INTO public.blog_posts (title, slug, content, excerpt, category, published)
-- VALUES (
--     'Welcome to the Omegatek Blog',
--     'welcome-to-omegatek-blog',
--     '<h2>Welcome!</h2><p>We repair, upgrade, and advise on all things tech.</p>',
--     'We repair, upgrade, and advise on all things tech.',
--     'General',
--     true
-- );

-- =============================================================
-- HOW TO CREATE YOUR ADMIN USER
-- =============================================================
-- 1. Go to: https://supabase.com/dashboard/project/pefjkiijqratjixskmdx
-- 2. Navigate to: Authentication → Users
-- 3. Click "Invite User" or "Add User"
-- 4. Enter your admin email + a strong password
-- 5. Use those credentials on the admin login page
-- =============================================================
