-- ============================================================
-- Pilates Physics: Daily snapshots and admin aggregation views
--
-- Three things the analytics engine needs from the database that nothing
-- provided before:
--
--   1. daily_snapshots: one row per UTC day of point-in-time counts that are
--      only observable live (Kit list size and tag counts, account count,
--      cumulative revenue, live offers). Kit's growth endpoint only looks back
--      30 days and keeps no tag history, so the only way to chart "subscribers
--      over the year" is to write the number down every day. Filled by
--      api/cron/daily-snapshot.js. History accrues forward from the first run.
--
--   2. Aggregation views over activity_events, so the admin pages stop reading
--      50,000 raw rows into a serverless function to count them in JS.
--
--   3. Security-definer counters over auth.users, which PostgREST cannot see.
--      The admin pages were paging auth.admin.listUsers (capped at 1000) to
--      get a count.
--
-- Everything here is read by the API with the service role. Views are plain
-- security_invoker views; the functions are revoked from every client role.
--
-- See docs/admin-analytics-engine-plan.md, sections 4.4 and 4.5.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Daily snapshots
-- ------------------------------------------------------------
create table public.daily_snapshots (
  snapshot_date date primary key,

  -- { subscribers, new_1d, cancellations_1d, email_90d: {...} }
  kit jsonb,
  -- { "<tag name>": active_count, ... } for the funnel tags and every product tag.
  tags jsonb,
  -- { total_accounts, entitlements_by_source: {...} }
  users jsonb,
  -- { orders, gross_cents, refund_cents, net_cents, unsettled_orders }
  revenue jsonb,
  -- { minted, redeemed, live }
  offers jsonb,
  -- Per-section error strings. A Kit outage costs one section, not the row.
  errors jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger daily_snapshots_touch_updated_at
  before update on public.daily_snapshots
  for each row execute function public.touch_updated_at();

alter table public.daily_snapshots enable row level security;

create policy "Admins read daily snapshots" on public.daily_snapshots
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- 2. Engagement views over activity_events
-- ------------------------------------------------------------

-- One row per (event type, item): how many opens and how many distinct
-- people, all time. "Item" is the content row, the tool slug or the workshop,
-- whichever the event carries. count(distinct user_id) skips nulls, so an
-- anonymous row never inflates the people count.
create view public.admin_engagement_by_item
with (security_invoker = on) as
select
  a.event_type,
  coalesce(a.content_id::text, a.tool_slug, a.webinar_slug, a.metadata->>'content_title', 'unknown') as item_key,
  coalesce(c.title, a.metadata->>'content_title', a.tool_slug, a.webinar_slug, 'Untitled') as label,
  a.webinar_id,
  count(*)::integer as opens,
  count(distinct a.user_id)::integer as distinct_users,
  min(a.created_at) as first_at,
  max(a.created_at) as last_at
from public.activity_events a
left join public.webinar_content c on c.id = a.content_id
where a.event_type in ('content_click', 'download', 'tool_open', 'certificate_download', 'portal_view')
group by 1, 2, 3, 4;

-- One row per (UTC day, event type, workshop): opens and distinct people that
-- day. Distinct counts per day cannot be summed across days; use
-- count_active_users() for a window.
create view public.admin_engagement_daily
with (security_invoker = on) as
select
  (a.created_at at time zone 'UTC')::date as day,
  a.event_type,
  a.webinar_id,
  a.webinar_slug,
  count(*)::integer as events,
  count(distinct a.user_id)::integer as distinct_users
from public.activity_events a
group by 1, 2, 3, 4;

-- ------------------------------------------------------------
-- 3. Counters the API cannot get through PostgREST
-- ------------------------------------------------------------

-- Distinct signed-in people with any activity since p_since.
create or replace function public.count_active_users(p_since timestamptz)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct user_id)::integer
  from public.activity_events
  where created_at >= p_since and user_id is not null;
$$;

revoke all on function public.count_active_users(timestamptz) from public, anon, authenticated;

-- Total accounts. auth.users is not exposed through PostgREST, and
-- auth.admin.listUsers() caps at 1000 per page.
create or replace function public.count_auth_users()
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select count(*)::integer from auth.users;
$$;

revoke all on function public.count_auth_users() from public, anon, authenticated;

-- New accounts per UTC day, for "new accounts over time" charts.
create or replace function public.admin_auth_users_daily()
returns table (day date, new_users integer)
language sql
stable
security definer
set search_path = public, auth
as $$
  select (created_at at time zone 'UTC')::date as day, count(*)::integer as new_users
  from auth.users
  group by 1
  order by 1;
$$;

revoke all on function public.admin_auth_users_daily() from public, anon, authenticated;

-- id, created_at and last_sign_in_at for every account, so the admin API can
-- answer "which buyers have never signed in" without paging listUsers.
create or replace function public.admin_auth_users_brief()
returns table (id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id, u.email::text, u.created_at, u.last_sign_in_at
  from auth.users u;
$$;

revoke all on function public.admin_auth_users_brief() from public, anon, authenticated;
