-- ============================================================
-- Pilates Physics: Touch Attribution
--
-- How each account found us, from our own first-party capture.
-- src/lib/attribution.js keeps two records in the visitor's browser: the
-- first page load it ever made (first touch, never overwritten) and the most
-- recent one that arrived from an external referrer or a UTM-tagged link
-- (last touch). Both travel to the server at the two moments a person becomes
-- known to us, the calculator claim (api/springs101.js) and checkout
-- (api/checkout/create-session.js -> api/_lib/provision-purchase.js), and
-- api/_lib/attribution.js writes them here once.
--
-- Written ONLY by the service role. There is no INSERT policy on purpose: the
-- browser can post anything, so the server re-validates every field before it
-- lands (attribution_clean below mirrors the client's redaction) and a row can
-- never be written against someone else's account.
--
-- Typed columns rather than jsonb so the Funnel page's breakdowns are plain
-- SQL. Hosts and pathnames only, never a full URL or a query string.
--
-- See docs/admin-analytics-engine-plan.md, section 4.2.
-- ============================================================

create table public.touch_attribution (
  -- One row per account. ON DELETE SET NULL rather than cascade so the funnel
  -- keeps counting a source after the account is deleted; email is the
  -- remaining handle, as in activity_events.
  user_id uuid unique references auth.users(id) on delete set null,
  email text,

  first_referrer_host text,
  first_utm_source text,
  first_utm_medium text,
  first_utm_campaign text,
  first_utm_content text,
  first_utm_term text,
  first_landing_path text,
  first_seen_at timestamptz,

  last_referrer_host text,
  last_utm_source text,
  last_utm_medium text,
  last_utm_campaign text,
  last_utm_content text,
  last_utm_term text,
  last_landing_path text,
  last_seen_at timestamptz,

  -- Which moment produced the row. A row with both touch sets null means the
  -- browser kept no record (storage blocked or cleared), as opposed to no row
  -- at all: an account from before this existed.
  recorded_via text not null check (recorded_via in ('lead_claim', 'checkout', 'backfill')),

  created_at timestamptz not null default now()
);

create index idx_touch_attribution_created on public.touch_attribution (created_at desc);
create index idx_touch_attribution_email on public.touch_attribution (lower(email));

alter table public.touch_attribution enable row level security;

create policy "Admins read touch attribution" on public.touch_attribution
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- attribution_clean(value, max_len): a stored value, or null.
-- Server-side half of the client's redaction: anything email-, UUID- or
-- JWT-shaped is dropped, and everything is capped. Kept in SQL so a one-off
-- backfill from another source gets the same treatment as the API path.
-- ------------------------------------------------------------
create or replace function public.attribution_clean(p_value text, p_max integer)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_value is null or btrim(p_value) = '' then null
    when p_value ~* '[^[:space:]@/]+@[^[:space:]@/]+\.[a-z]{2,}' then null
    when p_value ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' then null
    when p_value ~ 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' then null
    else left(btrim(p_value), p_max)
  end;
$$;

revoke all on function public.attribution_clean(text, integer) from public, anon, authenticated;
