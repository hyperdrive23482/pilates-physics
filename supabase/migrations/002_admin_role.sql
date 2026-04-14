-- ============================================================
-- Admin role: is_admin flag on user metadata + RLS policies
-- Run this in Supabase SQL Editor AFTER 001_webinar_portal.sql
-- ============================================================

-- Helper function to check admin status from JWT metadata
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  )
$$;

-- ============================================================
-- Admin policies: full CRUD on webinar tables
-- ============================================================

-- Webinars: admins can do everything (including drafts)
create policy "Admins full access to webinars"
  on public.webinars for all
  using (public.is_admin())
  with check (public.is_admin());

-- Webinar content: admins can manage all content
create policy "Admins full access to content"
  on public.webinar_content for all
  using (public.is_admin())
  with check (public.is_admin());

-- User entitlements: admins can grant/revoke access
create policy "Admins full access to entitlements"
  on public.user_entitlements for all
  using (public.is_admin())
  with check (public.is_admin());

-- Webinar questions: admins can read all questions
create policy "Admins read all questions"
  on public.webinar_questions for select
  using (public.is_admin());

-- ============================================================
-- TO SET YOURSELF AS ADMIN:
-- Run this in Supabase SQL Editor, replacing YOUR_USER_ID:
--
--   UPDATE auth.users
--   SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'::jsonb
--   WHERE id = 'YOUR_USER_ID';
--
-- Find your user ID in Authentication > Users in Supabase dashboard.
-- ============================================================
