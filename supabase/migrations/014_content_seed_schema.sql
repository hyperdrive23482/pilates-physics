-- ============================================================
-- Pilates Physics: Content Seed — Schema additions
--
-- Adds structured tables for glossary terms and audience personas,
-- extends content_ideas with format/category/difficulty + newsletter
-- metadata (jsonb), and adds a dedup unique index on brain_entries
-- so the seed data migration can use ON CONFLICT (type, title).
--
-- All admin-only via is_admin(). No public-read for now.
-- ============================================================

-- ---------- 0. Extend blog_posts --------------------------------
-- canonical_url points to the original Substack URL for the 16
-- mirrored historical posts. New posts created via the CMS leave
-- this null (their canonical IS the site).
alter table public.blog_posts
  add column if not exists canonical_url text;

-- ---------- 1. Extend content_ideas -----------------------------
alter table public.content_ideas
  add column if not exists format text
    check (format is null or format in ('blog','reel','newsletter','both','series')),
  add column if not exists category text,
  add column if not exists difficulty text
    check (difficulty is null or difficulty in ('quick','hard')),
  add column if not exists newsletter_data jsonb;

-- newsletter_data only meaningful when format='newsletter'
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'content_ideas_newsletter_data_format'
      and conrelid = 'public.content_ideas'::regclass
  ) then
    alter table public.content_ideas
      add constraint content_ideas_newsletter_data_format
        check (newsletter_data is null or format = 'newsletter');
  end if;
end $$;

create index if not exists idx_content_ideas_format_status
  on public.content_ideas (format, status);

-- ---------- 2. Glossary terms -----------------------------------
create table if not exists public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  term text not null,
  plain_definition text not null,
  misconception text,
  example text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.glossary_terms enable row level security;

drop policy if exists "Admins full access to glossary_terms" on public.glossary_terms;
create policy "Admins full access to glossary_terms"
  on public.glossary_terms for all
  using (public.is_admin()) with check (public.is_admin());

-- Admin-only for now. Add a public-read policy later if/when a
-- glossary lookup page ships:
--   create policy "Public reads active glossary_terms"
--     on public.glossary_terms for select using (is_active = true);

drop trigger if exists tg_glossary_terms_updated_at on public.glossary_terms;
create trigger tg_glossary_terms_updated_at
  before update on public.glossary_terms
  for each row execute function public.touch_updated_at();

-- ---------- 3. Personas -----------------------------------------
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  role text not null,
  background text,
  relationship_to_work text,
  posture text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personas enable row level security;

drop policy if exists "Admins full access to personas" on public.personas;
create policy "Admins full access to personas"
  on public.personas for all
  using (public.is_admin()) with check (public.is_admin());

drop trigger if exists tg_personas_updated_at on public.personas;
create trigger tg_personas_updated_at
  before update on public.personas
  for each row execute function public.touch_updated_at();

-- ---------- 4. Brain entries dedup ------------------------------
-- Lets the seed data migration use ON CONFLICT (type, title)
-- DO UPDATE for idempotent re-runs.
create unique index if not exists brain_entries_type_title_uniq
  on public.brain_entries (type, title);
