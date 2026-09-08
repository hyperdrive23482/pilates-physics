-- ============================================================
-- Rename the reformer course slug.
--
-- 045 originally seeded the course as 'making-of-a-reformer'. The course
-- was renamed How a Reformer Works before it shipped, and 045 now seeds
-- the new slug directly. On any database where the old 045 already ran
-- (dev), this moves the existing row rather than leaving a duplicate
-- behind the new slug. On prod it is a no-op. kit_tag is deliberately
-- untouched: the Kit automations trigger on 'MOR-purchased' by name.
-- ============================================================

update public.webinars
set slug     = 'how-a-reformer-works',
    title    = 'How a Reformer Works',
    subtitle = 'Inside the mechanisms that make your reformer magical'
where slug = 'making-of-a-reformer'
  and not exists (
    select 1 from public.webinars where slug = 'how-a-reformer-works'
  );
