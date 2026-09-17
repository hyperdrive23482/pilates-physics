-- ============================================================
-- Pilates Physics: Workshop early bird pricing
--
-- A workshop can sell at a lower price until 11:59pm Pacific on a chosen last
-- day. Same mechanism as the $39 course offer (050): a second Stripe Price on
-- the same Product, not a coupon, because Adaptive Pricing rules coupons out.
-- Stripe therefore enforces nothing, and the date check in
-- api/checkout/create-session.js (via api/_lib/early-bird.js) is the entire
-- enforcement layer.
--
-- Early bird is on only when all three columns are set, the row is a workshop
-- (kind = 'webinar'), and now() < early_bird_ends_at. A price and price ID
-- with no end date is dormant, which is what a clone inherits: the old
-- cohort's deadline is cleared, the prices carry over, and nothing goes live
-- until the admin picks a new last day.
--
-- early_bird_price_cents is display only, like price_cents. The amount charged
-- is whatever the Stripe Price says, so keep the two in step.
-- ============================================================

alter table public.webinars
  add column early_bird_price_cents integer check (early_bird_price_cents >= 0),
  add column early_bird_stripe_price_id text,
  add column early_bird_ends_at timestamptz;

comment on column public.webinars.early_bird_price_cents is
  'Early bird price shown on the page, in cents. Display only; Stripe charges the early_bird_stripe_price_id amount.';
comment on column public.webinars.early_bird_stripe_price_id is
  'Second Stripe Price on the workshop''s Product, charged while early bird is active.';
comment on column public.webinars.early_bird_ends_at is
  'The instant early bird closes: 23:59:59 America/Los_Angeles on the last day. Null means early bird is off.';
