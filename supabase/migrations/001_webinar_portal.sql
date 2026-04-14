-- ============================================================
-- Pilates Physics: Webinar Portal Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Webinars table
create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  price_cents integer,
  status text not null default 'draft'
    check (status in ('draft', 'upcoming', 'live', 'complete', 'archived')),
  zoom_link text,
  zoom_passcode text,
  scheduled_at timestamptz,
  duration_min integer,
  recording_url text,
  hero_image_url text,
  kit_tag text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Webinar content items
create table public.webinar_content (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  type text not null
    check (type in ('recording', 'download', 'bonus', 'slide_deck', 'resource', 'link')),
  title text not null,
  description text,
  file_url text,
  sort_order integer default 0,
  available_after text not null default 'always'
    check (available_after in ('always', 'post_webinar')),
  created_at timestamptz default now()
);

-- 3. User entitlements (access control)
create table public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  source text not null default 'manual'
    check (source in ('manual', 'kit_tag', 'stripe', 'admin', 'bundle')),
  granted_at timestamptz default now(),
  expires_at timestamptz,
  unique (user_id, webinar_id)
);

-- 4. Pre-webinar questions
create table public.webinar_questions (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  submitted_at timestamptz default now(),
  is_answered boolean default false
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.webinars enable row level security;
alter table public.webinar_content enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.webinar_questions enable row level security;

-- Webinars: anyone can read non-draft webinars
create policy "Public webinars readable"
  on public.webinars for select
  using (status != 'draft');

-- Webinar content: only entitled users can read
create policy "Entitled users read content"
  on public.webinar_content for select
  using (
    exists (
      select 1 from public.user_entitlements
      where user_entitlements.webinar_id = webinar_content.webinar_id
        and user_entitlements.user_id = auth.uid()
        and (user_entitlements.expires_at is null or user_entitlements.expires_at > now())
    )
  );

-- User entitlements: users read their own
create policy "Users read own entitlements"
  on public.user_entitlements for select
  using (user_id = auth.uid());

-- Webinar questions: users manage their own
create policy "Users read own questions"
  on public.webinar_questions for select
  using (user_id = auth.uid());

create policy "Users insert own questions"
  on public.webinar_questions for insert
  with check (user_id = auth.uid());

-- ============================================================
-- Indexes
-- ============================================================

create index idx_webinars_slug on public.webinars(slug);
create index idx_webinars_status on public.webinars(status);
create index idx_webinar_content_webinar on public.webinar_content(webinar_id);
create index idx_user_entitlements_user on public.user_entitlements(user_id);
create index idx_user_entitlements_webinar on public.user_entitlements(webinar_id);
create index idx_webinar_questions_webinar on public.webinar_questions(webinar_id);
