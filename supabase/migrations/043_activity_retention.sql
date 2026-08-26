-- ============================================================
-- Pilates Physics: Activity retention
--
-- Retention policy: 26 months of full detail, after which ip_address and
-- user_agent are nulled and the rest of the record is kept. 26 months
-- comfortably outlasts card-network dispute windows (the usual window is 120
-- days, but pre-arbitration and arbitration extend past that and Visa's outer
-- limit for some reason codes runs to 540 days), with margin.
--
-- Migration 042's trigger blocks every UPDATE, which would also block that
-- redaction. This replaces the function so a past-horizon UPDATE is allowed,
-- but ONLY when it nulls ip_address / user_agent and changes nothing else.
-- The trigger itself is unchanged and is not recreated.
-- ============================================================

create or replace function public.activity_events_append_only()
returns trigger
language plpgsql
as $$
declare
  horizon timestamptz := now() - interval '26 months';
begin
  if tg_op = 'DELETE' then
    if old.created_at > horizon then
      raise exception
        'activity_events: cannot delete rows inside the 26-month retention window';
    end if;
    return old;
  end if;

  -- Inside the retention window the row is completely immutable.
  if old.created_at > horizon then
    raise exception
      'activity_events is append-only: UPDATE is not permitted inside the retention window';
  end if;

  -- Past the horizon the only permitted change is redacting personal data,
  -- which is what api/cron/redact-activity.js does. Both fields may only move
  -- toward null, and every other column must be identical, so this can never
  -- become a general-purpose edit path.
  if new.ip_address is not null or new.user_agent is not null then
    raise exception
      'activity_events: past-horizon UPDATE may only null ip_address and user_agent';
  end if;

  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.email is distinct from old.email
     or new.event_type is distinct from old.event_type
     or new.source is distinct from old.source
     or new.webinar_id is distinct from old.webinar_id
     or new.webinar_slug is distinct from old.webinar_slug
     or new.content_id is distinct from old.content_id
     or new.tool_slug is distinct from old.tool_slug
     or new.entitled is distinct from old.entitled
     or new.path is distinct from old.path
     or new.metadata is distinct from old.metadata
     or new.created_at is distinct from old.created_at then
    raise exception
      'activity_events: past-horizon UPDATE may only null ip_address and user_agent';
  end if;

  return new;
end;
$$;

-- Supports the retention sweep's "old rows that still carry personal data"
-- scan without walking the whole table.
create index idx_activity_events_redaction
  on public.activity_events (created_at)
  where ip_address is not null or user_agent is not null;
