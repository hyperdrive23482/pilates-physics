-- ============================================================
-- Pilates Physics: Subscriber Offers
--
-- One row per person per campaign: the $39 window on How a Reformer Works,
-- opened when Kit applies `in-HARW-sequence` and closed at end of day four
-- calendar days later.
--
-- THIS TABLE IS THE ENTITLEMENT. There is no Stripe coupon and no promotion
-- code, because Adaptive Pricing is on: amount_off coupons are currency-locked
-- and cannot apply to a session presented in EUR, and no two-decimal percent_off
-- lands on $39.00 exactly against $69.00. The offer path passes a different
-- Price instead of a discounted one, which means Stripe enforces nothing here
-- and the server-side token check in api/checkout/create-session.js is the
-- entire enforcement layer. That check is the thing to test.
--
-- The upside of having no code: there is no string a customer can paste into a
-- studio Facebook group, because no such string exists. The token in the URL is
-- the whole entitlement, and it is bound to one row.
--
-- See docs/how-a-reformer-works-build-plan.md, Phase 0.
-- ============================================================

create table public.subscriber_offers (
  id uuid primary key default gen_random_uuid(),

  -- Which campaign minted this. The cron writes 'reformer-backfill-2026-09'
  -- for anyone carrying the HARW-backfill tag and 'reformer-nurture' for
  -- everyone else. Both cohorts arrive through the same in-HARW-sequence tag,
  -- so that tag is the ONLY thing that can tell them apart.
  --
  -- Paired with the unique index below, this does two jobs at once: nobody
  -- gets two offers inside one campaign, and a re-run next year is not
  -- silently blocked by a row from this one.
  offer_key text not null,

  -- The address the offer was minted for, from Kit. Stored lowercased; the
  -- recovery lookup in api/offer/recover.js matches on lower(email).
  email text not null,

  -- Opaque, and generated in the cron with node's crypto rather than here.
  -- No pgcrypto dependency, and nothing about the value is derived from the
  -- subscriber, so a token carries no PII into a URL, a referrer header or a
  -- forwarded email.
  token text not null unique,

  webinar_id uuid not null references public.webinars(id) on delete cascade,

  -- End of day, 23:59:59 America/Los_Angeles, four calendar days out. NOT
  -- now() + 72h: a ragged afternoon expiry makes "until tomorrow", "today" and
  -- "ends at midnight" false in emails 6, 7 and 8, and email 8 would send at
  -- 8pm against a window that had already closed. The Pacific anchor means
  -- everyone east of it gets their own midnight honoured and then some.
  --
  -- The cron formats this same value into the Kit offer_deadline field as a
  -- human string. One computation, two destinations, so the copy and the
  -- enforcement cannot drift.
  expires_at timestamptz not null,

  -- First load of the offer page. Analytics only, never enforcement.
  first_seen_at timestamptz,

  -- Stamped by the Stripe webhook on a completed purchase.
  --
  -- Checked at session creation and written here after payment, so the two are
  -- not atomic and two simultaneous checkout sessions on one token can both
  -- pay. Accepted deliberately: once either completes, every later attempt
  -- fails, which leaves only the two-tabs-at-once case. Reserving at session
  -- creation would need a TTL and a checkout.session.expired release to avoid
  -- locking a buyer out of their own token after an abandoned checkout.
  redeemed_at timestamptz,

  -- The address that actually paid, which is NOT always `email` above.
  --
  -- Forwarded links are allowed to work. Requiring a match would reject the
  -- teacher whose Kit address is their gmail and whose card sits on their
  -- studio address, with no explanation they could act on -- the exact
  -- bait-and-switch the expired pricing block exists to prevent, aimed at a
  -- real customer instead of a freeloader. This column records the leak
  -- instead of blocking it. Compare it against `email` after launch: it is the
  -- one decision here taken on a guess about behaviour rather than a property
  -- of the system.
  redeemed_email text,

  -- Throttles api/offer/recover.js to one send per row per 15 minutes.
  --
  -- This is the entire rate limit on that route and it is sufficient: no email
  -- is sent unless a matching row already exists, so the blast radius is
  -- bounded to addresses already on the list, and the response never varies
  -- whether or not one was found.
  recovery_sent_at timestamptz,

  -- Null until the token and deadline have been written back to Kit. The
  -- partial index below makes the nulls a retry queue.
  kit_synced_at timestamptz,

  created_at timestamptz not null default now(),

  -- A paid-at with no payer is a half-written record. The reverse is nonsense
  -- outright, so only the one direction is constrained: the webhook may fail
  -- to resolve an address without losing the fact of the redemption.
  constraint subscriber_offers_redeemed_pair
    check (redeemed_email is null or redeemed_at is not null)
);

-- ============================================================
-- Indexes
-- ============================================================

-- One offer per person per campaign -- and the case folding is not cosmetic.
--
-- A plain unique (offer_key, email) is case-SENSITIVE, and Kit hands back
-- whatever the subscriber typed at signup. Sarah@Studio.com and
-- sarah@studio.com would be two rows, two tokens and two four-day windows for
-- one person in one campaign, and the cron's dedup step would not notice
-- because it reads the same constraint. Folding here makes the guarantee hold
-- regardless of what the writer remembers to normalise.
--
-- This also serves the cron's dedup lookup, which knows the offer_key.
create unique index idx_subscriber_offers_person_campaign
  on public.subscriber_offers (offer_key, lower(email));

-- Open windows, for the countdown sweep and for "who is still live".
create index idx_subscriber_offers_open
  on public.subscriber_offers (expires_at)
  where redeemed_at is null;

-- The retry queue: rows holding a token Kit never received. A cron run that
-- dies halfway is picked up fifteen minutes later from exactly here, which is
-- why the job needs no cursor and no stored state.
create index idx_subscriber_offers_unsynced
  on public.subscriber_offers (kit_synced_at)
  where kit_synced_at is null;

-- The recovery lookup. The unique index above leads with offer_key, so it
-- cannot serve a query that knows only the email -- and the recovery route
-- knows only the email.
create index idx_subscriber_offers_email
  on public.subscriber_offers (lower(email));

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.subscriber_offers enable row level security;

-- Admin read only. There is deliberately no policy for anyone else, in either
-- direction: the offer page reads through api/offer.js with the service role
-- and never touches this table from the browser.
--
-- This matters more here than on most tables. A browser-readable row set would
-- hand out every live token at once, and the token IS the discount.
create policy "Admins read subscriber offers"
  on public.subscriber_offers for select
  using (public.is_admin());
