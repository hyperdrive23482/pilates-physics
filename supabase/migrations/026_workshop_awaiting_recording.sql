-- ============================================================
-- Pilates Physics: awaiting_recording workshop status
--
-- Adds an intermediate state between `upcoming` and `complete`.
-- A workshop enters `awaiting_recording` automatically when its
-- scheduled_at + 1 hour has passed (handled by the publish-scheduled
-- cron). It then auto-promotes to `complete` as soon as
-- recording_url is populated (handled by the trigger below), so the
-- "Recording Available" badge stays accurate without admin polling.
-- ============================================================

-- 1. Widen the status CHECK constraint
alter table public.webinars
  drop constraint if exists webinars_status_check;

alter table public.webinars
  add constraint webinars_status_check
  check (status in ('draft', 'upcoming', 'live', 'awaiting_recording', 'complete', 'archived'));

-- 2. Auto-promote awaiting_recording -> complete when recording_url is set
create or replace function public.webinars_autocomplete_on_recording()
returns trigger
language plpgsql
as $$
begin
  if NEW.status = 'awaiting_recording'
     and NEW.recording_url is not null
     and length(trim(NEW.recording_url)) > 0 then
    NEW.status := 'complete';
  end if;
  return NEW;
end;
$$;

drop trigger if exists webinars_autocomplete_on_recording_trg on public.webinars;

create trigger webinars_autocomplete_on_recording_trg
  before insert or update of recording_url, status on public.webinars
  for each row execute function public.webinars_autocomplete_on_recording();
