-- ============================================================
-- Pilates Physics: Optional end date on announcements
-- Lets the bar hide automatically without needing a replacement.
-- ============================================================

alter table public.announcements
  add column if not exists ends_at timestamptz;

alter table public.announcements
  add constraint announcement_window_valid
    check (ends_at is null or ends_at > starts_at);

-- Update the public read policy so expired rows are no longer
-- visible to the public site.
drop policy if exists "Public reads active announcements" on public.announcements;

create policy "Public reads active announcements"
  on public.announcements for select
  using (
    enabled = true
    and starts_at <= now()
    and (ends_at is null or ends_at > now())
  );
