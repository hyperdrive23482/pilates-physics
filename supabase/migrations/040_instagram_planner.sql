-- ============================================================
-- Pilates Physics: Instagram planner
--
-- A single table holding one row per post at any stage of life:
--   status='idea'        — captured, nothing made yet
--   status='in_progress' — filming / editing / writing
--   status='published'   — live, with metrics
--
-- Ideas and published posts share a table on purpose. The whole
-- point of the tool is "what have I actually covered in this
-- category, and where are the holes?", which only reads well when
-- the archive and the backlog sit side by side under one heading.
--
-- Sync-ready: ig_media_id, metrics_synced_at and the
-- 'uncategorized' category exist so the Instagram Graph API layer
-- can be added later without a schema change. Posts pulled from
-- the API land as 'uncategorized' and get sorted in the UI.
--
-- Admin-only via is_admin(). Never publicly readable.
-- ============================================================

create table public.instagram_posts (
  id uuid primary key default gen_random_uuid(),

  category text not null default 'uncategorized'
    check (category in (
      'spring_school',
      'brand_files',
      'same_spring_different_body',
      'pop_quiz',
      'weight_stack',
      'misc',
      'uncategorized'
    )),

  title text not null,
  description text,
  -- Opening line or caption draft, parked while the post is still an idea
  hook text,

  format text
    check (format is null or format in ('reel', 'carousel', 'static')),

  status text not null default 'idea'
    check (status in ('idea', 'in_progress', 'published')),

  -- Populated once status='published', by hand or by the sync layer
  posted_at date,
  post_url text,
  views int check (views is null or views >= 0),
  comments int check (comments is null or comments >= 0),
  shares int check (shares is null or shares >= 0),
  saves int check (saves is null or saves >= 0),

  -- Instagram Graph API linkage (unused until the sync layer lands).
  -- Unique so a re-sync updates the existing row instead of duplicating.
  ig_media_id text unique,
  metrics_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.instagram_posts enable row level security;

create policy "Admins full access to instagram_posts"
  on public.instagram_posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- Main read path: everything in a category, newest first
create index idx_instagram_posts_category_created
  on public.instagram_posts (category, created_at desc);

-- Archive view: published posts by date
create index idx_instagram_posts_posted_at
  on public.instagram_posts (posted_at desc)
  where status = 'published';

create trigger tg_instagram_posts_updated_at
  before update on public.instagram_posts
  for each row execute function public.touch_updated_at();
