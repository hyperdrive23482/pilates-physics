-- SEO dashboard (docs/admin-analytics-engine-plan.md, section 7, part 3b):
-- audit runs, their findings, dismissals, the Search Console cache and Google's
-- index verdicts. Ported from remo's 20260923160000_seo_dashboard.sql.
--
-- ACCESS. RLS is on for every table and there are NO policies. Only the
-- service role reads or writes: api/admin/seo.js (admin gated) and the three
-- SEO crons. The browser never touches these tables.
--
-- The crons are Vercel crons in vercel.json, not pg_cron, like every other
-- scheduled job here.

-- ── Audit runs ──────────────────────────────────────────────────────────────
-- One row per crawl of the production site. `pages` is the per-page snapshot
-- the Audit tab renders; `site` is the robots and sitemap summary; `psi` maps
-- path to a PageSpeed summary, filled later by the slow run-psi action.
create table if not exists public.seo_audit_runs (
  id                 bigint generated always as identity primary key,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  triggered_by       text not null check (triggered_by in ('cron', 'manual')),
  site_origin        text not null,
  status             text not null default 'running' check (status in ('running', 'done', 'failed')),
  error              text,
  pages_crawled      integer not null default 0,
  errors             integer not null default 0,
  warnings           integer not null default 0,
  infos              integer not null default 0,
  site               jsonb,
  pages              jsonb,
  psi                jsonb not null default '{}'::jsonb,
  psi_pages          integer not null default 0,
  narrative          jsonb,
  narrative_cost_usd numeric(10, 4)
);

comment on table public.seo_audit_runs is
  'One SEO audit crawl of the production site. Findings hang off run_id; the latest done run is what /admin/seo shows.';

create index if not exists idx_seo_audit_runs_started
  on public.seo_audit_runs (started_at desc);

-- ── Findings ────────────────────────────────────────────────────────────────
-- Regenerated wholesale on every run: a finding missing from the next run is
-- fixed. `mode` names the pass that produced it: the raw HTML crawl,
-- PageSpeed, or a Search Console index check.
create table if not exists public.seo_audit_findings (
  id           bigint generated always as identity primary key,
  run_id       bigint not null references public.seo_audit_runs (id) on delete cascade,
  rule_id      text not null,
  severity     text not null check (severity in ('error', 'warn', 'info')),
  path         text,
  title        text not null,
  detail       text not null,
  evidence     jsonb,
  fix          text not null,
  source_files text[] not null default '{}',
  mode         text not null default 'raw' check (mode in ('raw', 'psi', 'gsc')),
  created_at   timestamptz not null default now()
);

comment on column public.seo_audit_findings.path is
  'Root-relative page path. NULL for a site-level finding (sitemap, robots, duplicate titles).';

create index if not exists idx_seo_audit_findings_run
  on public.seo_audit_findings (run_id, severity);

-- ── Dismissals ──────────────────────────────────────────────────────────────
-- Keyed by (rule, path) so "Ignore" survives the next run. Site-level findings
-- use path = '' because a primary key cannot hold NULL.
create table if not exists public.seo_finding_dismissals (
  rule_id      text not null,
  path         text not null default '',
  reason       text,
  dismissed_at timestamptz not null default now(),
  dismissed_by uuid,
  primary key (rule_id, path)
);

-- ── Search Console cache ────────────────────────────────────────────────────
-- Daily Search Analytics rows. Two shapes share the table: [date, page, query]
-- rows, and [date, page] totals with query = ''. Google samples the per-query
-- rows, so they sum below the page total; the Pages tab reads totals and the
-- Search tab reads queries. `page` is the pathname with the host stripped so
-- www and apex rows for one page merge; `url` keeps what Google sent.
create table if not exists public.seo_search_daily (
  date        date not null,
  page        text not null,
  query       text not null default '',
  url         text,
  clicks      integer not null default 0,
  impressions integer not null default 0,
  ctr         double precision not null default 0,
  position    double precision not null default 0,
  synced_at   timestamptz not null default now(),
  primary key (date, page, query)
);

create index if not exists idx_seo_search_daily_page_date
  on public.seo_search_daily (page, date desc);

-- ── Index status ────────────────────────────────────────────────────────────
-- One row per sitemap path from the URL Inspection API (quota 2,000 a day).
create table if not exists public.seo_index_status (
  path             text primary key,
  url              text,
  inspected_at     timestamptz not null default now(),
  verdict          text,
  coverage_state   text,
  indexing_state   text,
  google_canonical text,
  last_crawl       timestamptz,
  raw              jsonb
);

-- ── RLS: on, and closed ─────────────────────────────────────────────────────
alter table public.seo_audit_runs         enable row level security;
alter table public.seo_audit_findings     enable row level security;
alter table public.seo_finding_dismissals enable row level security;
alter table public.seo_search_daily       enable row level security;
alter table public.seo_index_status       enable row level security;
