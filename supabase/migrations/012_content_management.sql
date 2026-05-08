-- ============================================================
-- Pilates Physics: Content Management
--
-- A pipeline for AI-assisted blog/email drafting:
--   content_ideas    — idea repository (manual entry)
--   content_pieces   — the editorial unit (one blog + one email)
--   content_drafts   — versioned history of every Claude generation
--                      and every Kaleen edit
--   brain_entries    — past content (blogs, transcripts, style guide)
--                      injected into the Claude system prompt
--   blog_posts       — the public-facing blog
--
-- All admin-only via is_admin(); blog_posts has a public-read
-- policy for status='published' rows.
-- ============================================================

-- ---------- 1. Idea repository ---------------------------------
create table public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text,
  status text not null default 'open'
    check (status in ('open', 'selected', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_ideas enable row level security;

create policy "Admins full access to content_ideas"
  on public.content_ideas for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_content_ideas_status_created
  on public.content_ideas (status, created_at desc);

-- ---------- 5. Public blog (forward-declared so pieces can FK it) -
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_markdown text not null,
  body_html text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published')),
  scheduled_for timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

create policy "Admins full access to blog_posts"
  on public.blog_posts for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public reads published blog_posts"
  on public.blog_posts for select
  using (status = 'published' and published_at is not null and published_at <= now());

create index idx_blog_posts_published_at
  on public.blog_posts (published_at desc)
  where status = 'published';

create index idx_blog_posts_status_scheduled
  on public.blog_posts (status, scheduled_for)
  where status = 'scheduled';

-- ---------- 2. Content pieces ----------------------------------
create table public.content_pieces (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.content_ideas (id) on delete set null,
  title text,
  slug text unique,
  status text not null default 'drafting'
    check (status in (
      'drafting', 'in_review', 'approved',
      'scheduled', 'published', 'archived'
    )),
  scheduled_for timestamptz,
  published_at timestamptz,
  -- Latest approved (or in-progress) content, denormalized for fast read
  blog_markdown text,
  email_subject text,
  email_markdown text,
  -- Publish refs
  kit_broadcast_id text,
  blog_post_id uuid references public.blog_posts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.content_pieces enable row level security;

create policy "Admins full access to content_pieces"
  on public.content_pieces for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_content_pieces_status_updated
  on public.content_pieces (status, updated_at desc);

create index idx_content_pieces_scheduled_for
  on public.content_pieces (scheduled_for)
  where status = 'scheduled';

-- ---------- 3. Versioned drafts --------------------------------
create table public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references public.content_pieces (id) on delete cascade,
  version int not null,
  source text not null
    check (source in ('claude_initial', 'claude_revision', 'kaleen_edit')),
  feedback text,
  blog_markdown text,
  email_subject text,
  email_markdown text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  unique (piece_id, version)
);

alter table public.content_drafts enable row level security;

create policy "Admins full access to content_drafts"
  on public.content_drafts for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_content_drafts_piece
  on public.content_drafts (piece_id, version desc);

-- ---------- 4. Brain entries -----------------------------------
create table public.brain_entries (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in ('blog_post', 'transcript', 'style_guide')),
  title text not null,
  content text not null,
  source_url text,
  is_active boolean not null default true,
  token_estimate int,
  created_at timestamptz not null default now()
);

alter table public.brain_entries enable row level security;

create policy "Admins full access to brain_entries"
  on public.brain_entries for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_brain_entries_active
  on public.brain_entries (is_active, type);

-- ---------- updated_at triggers --------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tg_content_ideas_updated_at
  before update on public.content_ideas
  for each row execute function public.touch_updated_at();

create trigger tg_content_pieces_updated_at
  before update on public.content_pieces
  for each row execute function public.touch_updated_at();

create trigger tg_blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();
