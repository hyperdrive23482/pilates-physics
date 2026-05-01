-- ============================================================
-- Pilates Physics: Scheduled announcement bar
-- One row per announcement. The currently-active announcement is
-- the most recent enabled row whose starts_at <= now().
-- ============================================================

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  link_url text,
  link_text text,
  starts_at timestamptz not null,
  enabled boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint link_pair_complete
    check ((link_url is null) = (link_text is null))
);

alter table public.announcements enable row level security;

-- Public can read currently-active enabled announcements
create policy "Public reads active announcements"
  on public.announcements for select
  using (enabled = true and starts_at <= now());

-- Admins can do anything
create policy "Admins full access to announcements"
  on public.announcements for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_announcements_active
  on public.announcements (starts_at desc)
  where enabled = true;

-- Seed with the current EarlyBirdBanner content so the bar keeps showing
-- the same message after deploy until an admin changes it.
insert into public.announcements (message, link_url, link_text, starts_at)
values (
  'EARLY BIRD BONUS! Register before May 1st for a free bonus interactive spring force calculator.',
  '/workshops#register',
  'Register now →',
  now() - interval '1 day'
);
