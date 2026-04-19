-- ============================================================
-- Admin Storage: webinar-content bucket + RLS
-- Run in Supabase SQL Editor AFTER 003_stripe_integration.sql
-- ============================================================

-- Private bucket for webinar assets (recordings, slide decks, downloads)
insert into storage.buckets (id, name, public)
values ('webinar-content', 'webinar-content', false)
on conflict (id) do nothing;

-- ============================================================
-- Storage RLS policies
-- Object paths are expected to be: {webinar_id}/{filename}
-- ============================================================

-- Admins: full CRUD on webinar-content bucket
create policy "Admins upload webinar content"
  on storage.objects for insert
  with check (bucket_id = 'webinar-content' and public.is_admin());

create policy "Admins update webinar content"
  on storage.objects for update
  using (bucket_id = 'webinar-content' and public.is_admin())
  with check (bucket_id = 'webinar-content' and public.is_admin());

create policy "Admins delete webinar content"
  on storage.objects for delete
  using (bucket_id = 'webinar-content' and public.is_admin());

create policy "Admins read webinar content"
  on storage.objects for select
  using (bucket_id = 'webinar-content' and public.is_admin());

-- Entitled users: read-only access to files in their webinar's folder
create policy "Entitled users read webinar content"
  on storage.objects for select
  using (
    bucket_id = 'webinar-content'
    and exists (
      select 1 from public.user_entitlements e
      where e.user_id = auth.uid()
        and e.webinar_id::text = (storage.foldername(name))[1]
        and (e.expires_at is null or e.expires_at > now())
    )
  );

-- ============================================================
-- Seed: mark kaleen@remopilates.com as superadmin.
-- Uncomment and run ONCE; then sign out and back in so the JWT picks up the flag.
-- ============================================================
--
-- update auth.users
-- set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
-- where email = 'kaleen@remopilates.com';
