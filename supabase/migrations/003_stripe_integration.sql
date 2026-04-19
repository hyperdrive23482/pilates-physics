-- ============================================================
-- Pilates Physics: Stripe Integration
-- Adds stripe_price_id to webinars and a stripe_events log table
-- for idempotency + debugging. Run in Supabase SQL Editor.
-- ============================================================

-- Stripe Price ID per webinar (created manually in Stripe Dashboard)
alter table public.webinars add column stripe_price_id text;

-- Webhook event log (idempotency key + audit trail)
-- user_state drives the success-page copy:
--   'logged_in'  — purchase made while authenticated; no magic link needed
--   'returning'  — anonymous purchase by an existing user; magic link sent
--   'new'        — anonymous purchase by a new user; account created + magic link sent
-- status='kit_failed' means payment + entitlement succeeded but Kit.com tagging did not;
-- reconcile offline via an admin script if needed.
create table public.stripe_events (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  session_id text,
  event_type text not null,
  webinar_id uuid references public.webinars(id),
  user_id uuid references auth.users(id),
  user_state text
    check (user_state in ('logged_in', 'returning', 'new')),
  status text not null default 'processed'
    check (status in ('processed', 'failed', 'kit_failed')),
  error text,
  payload jsonb,
  created_at timestamptz default now()
);

create index idx_stripe_events_event_id on public.stripe_events(event_id);
create index idx_stripe_events_session_id on public.stripe_events(session_id);

-- The webhook writes via the service role, which bypasses RLS.
-- Do not add a restrictive INSERT policy here without updating the webhook to match.
alter table public.stripe_events enable row level security;

create policy "Admins read events" on public.stripe_events for select
  using ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);
