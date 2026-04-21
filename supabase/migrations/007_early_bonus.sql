-- ============================================================
-- Pilates Physics: Early-registration bonus
-- Per-webinar config: anyone who buys via Stripe inside the
-- bonus window is auto-granted entitlement to bonus_webinar_id.
-- ============================================================

alter table public.webinars
  add column if not exists bonus_webinar_id uuid references public.webinars(id) on delete set null,
  add column if not exists bonus_starts_at  timestamptz,
  add column if not exists bonus_ends_at    timestamptz;

alter table public.webinars
  add constraint bonus_window_valid
    check (bonus_ends_at is null or bonus_starts_at is null or bonus_ends_at > bonus_starts_at);

alter table public.webinars
  add constraint bonus_not_self
    check (bonus_webinar_id is null or bonus_webinar_id <> id);

create index if not exists idx_webinars_bonus
  on public.webinars(bonus_webinar_id)
  where bonus_webinar_id is not null;

-- Add 'bonus' to the entitlement source CHECK so we can distinguish
-- bonus grants from paid Stripe rows in reporting.
alter table public.user_entitlements drop constraint if exists user_entitlements_source_check;
alter table public.user_entitlements
  add constraint user_entitlements_source_check
    check (source in ('manual', 'kit_tag', 'stripe', 'admin', 'bundle', 'bonus'));
