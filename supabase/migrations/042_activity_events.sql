-- ============================================================
-- Pilates Physics: Activity Events
-- Append-only record of who signed in, from where, and what they opened.
--
-- Primary purpose is evidence: card-network chargeback disputes ask for IP
-- addresses, timestamps, and recorded activity, and auth.audit_log_entries is
-- pruned by Supabase. Product analytics is a secondary read of the same rows.
--
-- Written ONLY by the service role (see api/_lib/log-activity.js). There is
-- deliberately no INSERT policy: a browser-writable audit log is spoofable and
-- worthless as evidence. Follows the stripe_events pattern in 003.
-- ============================================================

create table public.activity_events (
  id bigserial primary key,

  -- Identity. ON DELETE SET NULL, never cascade: evidence has to outlive the
  -- account. `email` is a snapshot written server-side from the verified JWT,
  -- never from a request body, so a deleted user's trail stays attributable.
  user_id uuid references auth.users(id) on delete set null,
  email text,

  event_type text not null check (event_type in (
    'login',
    'portal_view',
    'dashboard_view',
    'content_click',
    'tool_open',
    'download',
    'certificate_download',
    'checkout_start',
    'purchase',
    'entitlement_granted',
    'lead_magnet_claim'
  )),

  -- 'server' = observed entirely inside a serverless function.
  -- 'client' = asserted by an authenticated browser; the JWT proves WHO, not
  -- WHAT. Kept distinct so evidence can be weighted honestly rather than
  -- overclaimed. Not backfillable, which is why it exists from day one.
  source text not null check (source in ('server', 'client')),

  -- No FK on content_id: the admin content manager deletes and re-creates
  -- webinar_content rows, and an evidence row must not forget what was opened
  -- when it does. Same reason webinar_slug is denormalized next to the FK.
  webinar_id uuid references public.webinars(id) on delete set null,
  webinar_slug text,
  content_id uuid,
  tool_slug text,

  -- True when the server independently re-verified an active entitlement for
  -- webinar_id at write time. Null when the event carried no webinar_id.
  -- This is what makes a client-asserted event carry a server-verified fact.
  entitled boolean,

  -- Query strings are stripped before storage: magic-link token_hash and
  -- OAuth codes travel there and must never land in a log.
  path text,

  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- The dispute query: one person's timeline, newest first.
create index idx_activity_events_user_time
  on public.activity_events (user_id, created_at desc);

-- After account deletion user_id is null and email is the only handle left.
-- Stripe hands you an email in a dispute, so this is the real entry point.
create index idx_activity_events_email_time
  on public.activity_events (lower(email), created_at desc);

create index idx_activity_events_type_time
  on public.activity_events (event_type, created_at desc);

create index idx_activity_events_webinar_time
  on public.activity_events (webinar_id, created_at desc);

create index idx_activity_events_content
  on public.activity_events (content_id) where content_id is not null;

-- ============================================================
-- Append-only enforcement
--
-- RLS with no INSERT/UPDATE/DELETE policy blocks the browser, but the service
-- role bypasses RLS entirely, so a stray supabaseAdmin.update() would go
-- through. This trigger is the actual guarantee.
--
-- DELETE is permitted only past the retention horizon, so the Phase 3 pruning
-- job can run while nothing can quietly erase live evidence.
-- ============================================================

create or replace function public.activity_events_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'activity_events is append-only: UPDATE is not permitted';
  end if;
  if old.created_at > now() - interval '26 months' then
    raise exception
      'activity_events: cannot delete rows inside the 26-month retention window';
  end if;
  return old;
end;
$$;

create trigger activity_events_append_only
  before update or delete on public.activity_events
  for each row execute function public.activity_events_append_only();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.activity_events enable row level security;

-- Admin read only. No INSERT policy on purpose: all writes go through the
-- service role in api/_lib/log-activity.js, which verifies a JWT first.
create policy "Admins read activity" on public.activity_events for select
  using (public.is_admin());
