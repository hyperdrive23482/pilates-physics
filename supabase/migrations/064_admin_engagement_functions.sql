-- ============================================================
-- Pilates Physics: Range-aware engagement functions for the Analytics page
--
-- The 063 views answer "all time". The Engagement tab (Phase 1 of
-- docs/admin-analytics-engine-plan.md, section 5) needs two things they
-- cannot give:
--
--   1. Tool and content rankings by DISTINCT people inside the selected
--      range. Distinct counts per day cannot be summed across days, so a
--      daily view is no help; the count has to run over the raw rows for
--      the window.
--
--   2. Sessions by weekday and hour of day, in Pacific time, so the admin
--      can see when people actually sit down with the portal. Day-of-week
--      and hour are computed in the requested zone, not UTC, because an
--      8pm Pacific login is a 3am UTC row and the chart would be useless.
--
-- Both are plain functions read by the API with the service role, revoked
-- from every client role the way count_active_users (063) is. A null
-- p_since means all time. The API falls back to the 063 views when these
-- are missing (deployed ahead of a db push).
-- ============================================================

create or replace function public.admin_engagement_items(p_since timestamptz)
returns table (
  event_type text,
  item_key text,
  label text,
  webinar_id uuid,
  opens integer,
  distinct_users integer
)
language sql
stable
set search_path = public
as $$
  select
    a.event_type,
    coalesce(a.content_id::text, a.tool_slug, a.webinar_slug, a.metadata->>'content_title', 'unknown') as item_key,
    coalesce(c.title, a.metadata->>'content_title', a.tool_slug, a.webinar_slug, 'Untitled') as label,
    a.webinar_id,
    count(*)::integer as opens,
    count(distinct a.user_id)::integer as distinct_users
  from public.activity_events a
  left join public.webinar_content c on c.id = a.content_id
  where a.event_type in ('content_click', 'download', 'tool_open', 'certificate_download', 'portal_view')
    and (p_since is null or a.created_at >= p_since)
  group by 1, 2, 3, 4;
$$;

revoke all on function public.admin_engagement_items(timestamptz) from public, anon, authenticated;

create or replace function public.admin_engagement_hourly(
  p_since timestamptz,
  p_tz text default 'America/Los_Angeles'
)
returns table (
  dow integer,
  hour integer,
  event_type text,
  events integer,
  distinct_users integer
)
language sql
stable
set search_path = public
as $$
  select
    extract(dow from (a.created_at at time zone p_tz))::integer as dow,
    extract(hour from (a.created_at at time zone p_tz))::integer as hour,
    a.event_type,
    count(*)::integer as events,
    count(distinct a.user_id)::integer as distinct_users
  from public.activity_events a
  where (p_since is null or a.created_at >= p_since)
  group by 1, 2, 3;
$$;

revoke all on function public.admin_engagement_hourly(timestamptz, text) from public, anon, authenticated;
