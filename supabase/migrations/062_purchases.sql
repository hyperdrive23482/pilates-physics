-- ============================================================
-- Pilates Physics: Purchases ledger
--
-- One row per paid Stripe Checkout Session. Until now revenue was computed in
-- JavaScript by parsing stripe_events.payload.amount_total on every admin
-- page load, treating every currency as USD cents and never subtracting a
-- refund or a lost dispute. This table is the normalized answer.
--
-- Written by api/stripe/webhook.js through api/_lib/purchases.js on
-- checkout.session.completed, then amended by charge.refunded and
-- charge.dispute.* events. The backfill at the bottom seeds it from the
-- Checkout Sessions already stored in stripe_events.payload.
--
-- Two amounts, deliberately:
--   presentment_amount_cents  what the buyer saw, in presentment_currency.
--                             Adaptive Pricing means this can be EUR or GBP.
--   settled_usd_cents         what landed in the Stripe balance, from the
--                             charge's balance transaction. Null until the
--                             settlement lookup has run (needs_settlement_lookup).
-- Revenue reports use settled_usd_cents and fall back to presentment only
-- when the currency is already USD.
--
-- user_entitlements remains the ACCESS record. A refund here never touches
-- it: refunds are a manual decision under an all-sales-final policy.
--
-- See docs/admin-analytics-engine-plan.md, section 4.3.
-- ============================================================

create table public.purchases (
  id uuid primary key default gen_random_uuid(),

  stripe_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  -- The stripe_events row this came from, when backfilled or webhook-written.
  source_event_id text,

  -- ON DELETE SET NULL, never cascade: a sale happened whether or not the
  -- account still exists. email is the remaining handle after deletion.
  user_id uuid references auth.users(id) on delete set null,
  email text,

  webinar_id uuid references public.webinars(id) on delete set null,
  webinar_slug text,

  -- Which Price the buyer was shown. 'scholarship' is a full-price Price with
  -- a scholarship promotion code on it, labelled from scholarship_enrollments.
  pricing text not null default 'full'
    check (pricing in ('full', 'early_bird', 'offer', 'scholarship', 'bundle')),

  presentment_currency text not null default 'usd',
  presentment_amount_cents integer not null default 0,
  settled_usd_cents integer,
  stripe_fee_cents integer,
  discount_cents integer not null default 0,
  promotion_code_id text,
  offer_id uuid references public.subscriber_offers(id) on delete set null,

  -- Mirrors stripe_events.user_state at the time of purchase.
  user_state text check (user_state in ('logged_in', 'returning', 'new')),

  purchased_at timestamptz not null,

  refunded_at timestamptz,
  refund_usd_cents integer not null default 0,
  disputed_at timestamptz,
  -- Stripe dispute status, e.g. needs_response, under_review, won, lost.
  dispute_status text,

  -- True until the charge's balance transaction has been read for
  -- settled_usd_cents and stripe_fee_cents. The admin "Settle" action clears
  -- it a batch at a time.
  needs_settlement_lookup boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_purchases_purchased_at on public.purchases (purchased_at desc);
create index idx_purchases_user on public.purchases (user_id, purchased_at desc);
create index idx_purchases_email on public.purchases (lower(email));
create index idx_purchases_webinar on public.purchases (webinar_id, purchased_at desc);
create index idx_purchases_charge on public.purchases (stripe_charge_id) where stripe_charge_id is not null;
create index idx_purchases_pi on public.purchases (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create index idx_purchases_unsettled on public.purchases (needs_settlement_lookup) where needs_settlement_lookup;

create trigger purchases_touch_updated_at
  before update on public.purchases
  for each row execute function public.touch_updated_at();

alter table public.purchases enable row level security;

create policy "Admins read purchases" on public.purchases
  for select using (public.is_admin());

-- ------------------------------------------------------------
-- Backfill from the Checkout Sessions already in stripe_events.
--
-- 'processed' and 'kit_failed' both mean the sale completed. 'failed' rows are
-- provisioning errors reconciled by hand and are left out, as they were in
-- api/admin/analytics-summary.js. DISTINCT ON session_id because a retried
-- event can appear twice. Every row starts needing a settlement lookup so
-- fees and foreign-currency settlement get filled by the admin action.
-- ------------------------------------------------------------
insert into public.purchases (
  stripe_session_id, stripe_payment_intent_id, source_event_id,
  user_id, email, webinar_id, webinar_slug, pricing,
  presentment_currency, presentment_amount_cents, settled_usd_cents,
  discount_cents, promotion_code_id, offer_id, user_state, purchased_at,
  needs_settlement_lookup
)
select distinct on (e.session_id)
  e.session_id,
  nullif(e.payload->>'payment_intent', ''),
  e.event_id,
  e.user_id,
  lower(coalesce(e.payload->'customer_details'->>'email', e.payload->'metadata'->>'email')),
  e.webinar_id,
  nullif(e.payload->'metadata'->>'webinar_slug', ''),
  case
    when se.id is not null then 'scholarship'
    when e.payload->'metadata'->>'pricing' in ('full', 'early_bird', 'offer', 'bundle')
      then e.payload->'metadata'->>'pricing'
    else 'full'
  end,
  lower(coalesce(e.payload->>'currency', 'usd')),
  coalesce((e.payload->>'amount_total')::integer, 0),
  case when lower(coalesce(e.payload->>'currency', 'usd')) = 'usd'
    then coalesce((e.payload->>'amount_total')::integer, 0) end,
  coalesce((e.payload->'total_details'->>'amount_discount')::integer, 0),
  nullif(e.payload->'discounts'->0->>'promotion_code', ''),
  case when (e.payload->'metadata'->>'offer_id') ~* '^[0-9a-f-]{36}$'
    then (e.payload->'metadata'->>'offer_id')::uuid end,
  e.user_state,
  coalesce(to_timestamp((e.payload->>'created')::bigint), e.created_at),
  true
from public.stripe_events e
left join public.scholarship_enrollments se on se.stripe_session_id = e.session_id
where e.event_type = 'checkout.session.completed'
  and e.status in ('processed', 'kit_failed')
  and e.session_id is not null
  and e.payload is not null
order by e.session_id, e.created_at desc
on conflict (stripe_session_id) do nothing;

-- ------------------------------------------------------------
-- admin_revenue_daily: one row per UTC day, product and pricing tier.
--
-- Read by the API with the service role, so a plain security_invoker view is
-- enough; an admin reading it through PostgREST is gated by the table's RLS.
-- gross_cents prefers the settled USD figure and otherwise counts only
-- orders already in USD; unsettled_orders says how many are still waiting.
-- ------------------------------------------------------------
create view public.admin_revenue_daily
with (security_invoker = on) as
select
  (p.purchased_at at time zone 'UTC')::date as day,
  p.webinar_id,
  p.webinar_slug,
  p.pricing,
  count(*)::integer as orders,
  sum(coalesce(p.settled_usd_cents,
      case when p.presentment_currency = 'usd' then p.presentment_amount_cents else 0 end))::integer as gross_cents,
  sum(p.discount_cents)::integer as discount_cents,
  sum(coalesce(p.stripe_fee_cents, 0))::integer as fee_cents,
  sum(p.refund_usd_cents)::integer as refund_cents,
  sum(case when p.dispute_status = 'lost'
      then coalesce(p.settled_usd_cents,
           case when p.presentment_currency = 'usd' then p.presentment_amount_cents else 0 end)
      else 0 end)::integer as dispute_lost_cents,
  count(*) filter (where p.needs_settlement_lookup)::integer as unsettled_orders
from public.purchases p
group by 1, 2, 3, 4;
