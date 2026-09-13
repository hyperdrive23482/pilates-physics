# How a Reformer Works: Build Plan

The technical plan for shipping the tripwire course and its four-day
subscriber offer. Companion to
[reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md),
which owns the content, pricing, and positioning decisions. This file owns
the mechanism.

This resolves the spec's open decision "Discount enforcement mechanism:
**Deferred.**"

> **Status, 2026-09-13. This file is now the offer machinery only.** The course
> product shipped under
> [how-a-reformer-works-course-plan.md](how-a-reformer-works-course-plan.md):
> the schema (`044_courses.sql`), the seeded product row and its eight modules
> (`045`, with `047`/`048`/`049` renaming the slug, moving the Kit tag, and
> clearing the CEC), admin authoring, the portal player, the graded quiz, the
> certificate, the sales page, and the `/education` card.
>
> **Phases 1, 4 and 5 below are done, and Phase 0 is down to one migration.**
> They are kept as a record, each under a header saying what actually shipped.
> The course-row SQL in Phase 0 and the whole of Phase 4's SQL are superseded,
> not a to-do — Phase 4's describes a table shape that is not the one that
> exists.
>
> **What is left is the offer itself:** the `subscriber_offers` table, the
> minting cron, `/offer/reformer`, the checkout branch, the `noindex` header, and
> the Kit changes. See **Build order**.

## Decisions locked

| Item | Decision | Why |
|------|----------|-----|
| Discount mechanism | A second Stripe Price at $39, no coupon | Adaptive Pricing is on, which rules out amount-off coupons |
| Deadline shape | End of day, fixed timezone, not tag time plus N hours | A ragged expiry contradicts "today," "tomorrow," and "midnight" in the copy. See "Timeline" |
| Kit structure | Two sequences with a visual automation carrying the handoff between them | Already built. See "The Kit flow as built" |
| Handoff tag | `in-HARW-sequence`, applied once nurture completes | Starts the offer clock and enrols them in the cart sequence. This is the tag the cron polls |
| Purchase tag | `HARW-purchased` (tags were `MOR-*` until 2026-09-08, after the original working title; renamed in place in Kit so automation wiring survived) | `webinars.kit_tag` must match this string exactly, or the buyer is never removed from the cart sequence |
| Offer identity | Opaque token in a Kit custom field | Survives cross-device; no PII in URLs |
| Clock start | When the Kit tag is applied, not on click | Deadline is printable in the email and immune to link prefetch |
| Sync method | Vercel cron poll, every 15 minutes | Reuses existing cron infrastructure; easier to debug than a webhook |
| Tag trigger | Kit sequences and automations, internally | The cron is a pure reader and never writes tags |
| Unknown-token recovery | Email the link, never render it. Identical response either way | A page that shows $39 to any address typed into it is the coupon code this design exists to avoid. Decided 2026-09-13 |
| Forwarded links | Allowed. Record the buying email rather than blocking the mismatch | Requiring a match would 410 the buyer whose Kit address and card address differ, which is the bait-and-switch the expired page exists to prevent. Decided 2026-09-13 |
| Backfill cohort | One `HARW-backfill` tag, doing three jobs | Gates email 4's Liquid conditional, tells the cron which `offer_key` to write, and retires the cohort cleanly. Decided 2026-09-13 |
| Launch cohort | The 238 who already completed nurture, bulk-tagged in waves | They finished before the handoff step existed and cannot reach it on their own. See "The backfill" |

## Why there is no Stripe coupon

The obvious design is one campaign coupon cloned into a per-subscriber
promotion code with `expires_at` and `max_redemptions: 1`, so Stripe enforces
the deadline at the payment layer. Adaptive Pricing breaks it.

`amount_off` coupons are currency-locked. A USD $30-off coupon cannot apply to
a session Adaptive Pricing has presented in EUR. And `percent_off`, which is
currency-agnostic, cannot land on $69.00 exactly: no two-decimal percentage
produces a $39.00 total. The nearest values are $39.01 and $38.99, and the
email copy says $39.

So the offer path uses a different Price instead of a discounted one.

This turns out to be better than a workaround. The spec already requires a
permanent $39 price for the PP101 order bump ("One number, no contradiction").
Building one $39 Price object and pointing two entry points at it is exactly
what the spec's framing rule describes.

What changes as a result:

- No `stripe_promotion_code_id` or `code` columns on the offer table
- No lazy promotion-code minting on first visit
- No Stripe objects to garbage collect
- No `discounts` against `allow_promotion_codes` conflict, because the offer
  path passes neither
- No visible code for the customer to copy, paste, or forward

The last one is a small loss of warmth and a real gain in safety. There is no
code that can be posted in a Facebook group, because no code exists. The token
in the URL is the entitlement.

**The tradeoff to accept:** enforcement now lives in one place, the server-side
token check in `create-session.js`. There is no Stripe-side backstop if that
check has a bug. It needs a test.

**Note for international buyers:** Adaptive Pricing will present the local
equivalent of $39. Write "$39 USD" in the email copy.

## The Kit flow as built

Confirmed against the Kit account on 2026-08-22. Two sequences and three visual
automations already exist. This plan is written against that, not against a
greenfield design.

### Tags

| Tag | Meaning | Applied by |
|-----|---------|------------|
| `spring-calc` | Claimed the free calculator | `api/springs101.js`, from `webinars.kit_tag` on the `spring-load-calculator` row (migration 039) |
| `in-nurture` | Currently inside the nurture sequence | "Spring Calc Welcome" automation |
| `completed-nurture` | Finished nurture | **Nothing. See "What still has to change"** |
| `in-HARW-sequence` | In the cart sequence, offer clock running | "Spring Calc Welcome" automation, final step |
| `HARW-didnotbuy` | Finished the cart sequence without buying | "HARW Email Sequence" automation, final step |
| `HARW-purchased` | Bought the course | `provisionPurchase`, from `webinars.kit_tag` on the course row |
| `HARW-backfill` | One of the 238 who finished nurture before the handoff existed | Bulk-applied by hand, in waves, immediately before `in-HARW-sequence`. See "The backfill" |

### Sequences

| Sequence | Emails |
|----------|--------|
| Spring Calc Welcome | A leftover transactional delivery email, then nurture emails 1, 2, 3 |
| How a Reformer Works | Cart emails 4, 5, 6, 7, 8 |

The offer lives entirely inside the second sequence. Nothing in nurture carries a
link that needs a token, which is what makes the handoff safe.

### Automations

```
Spring Calc Welcome   spring-calc  -> +in-nurture -> [Spring Calc Welcome seq]
                                   -> -in-nurture -> +in-HARW-sequence

HARW Email Sequence    in-HARW-sequence -> [How a Reformer Works seq]
                                      -> +HARW-didnotbuy
                                      -> -in-HARW-sequence

HARW Purchase          HARW-purchased -> -HARW-didnotbuy -> -in-HARW-sequence
```

Plus one classic automation rule: when `HARW-purchased` is applied, unsubscribe
from the How a Reformer Works sequence.

**That rule, not the tag removal, is what stops the sales emails.** Removing
`in-HARW-sequence` does not pull anyone out of a sequence already running. If the
rule is ever disabled, a day-1 buyer receives "$39 ends at midnight" three days
after paying, and nothing else in the system would catch it.

### Why this beats what this plan originally specified

The earlier draft put the offer tag on the last step of sequence 1. Here it sits
in the automation *between* the two sequences instead, which is better: the tag
is not coupled to a sequence step that could be reordered or deleted, and the
whole handoff is legible in one screen.

### What still has to change

- [ ] **`completed-nurture` is never applied.** The Spring Calc Welcome
      automation removes `in-nurture` and adds `in-HARW-sequence` with nothing in
      between. Add the step or retire the tag
- [ ] **A one-day delay on email 4**, expressed in days. See "Why email 4 cannot
      send immediately"
- [ ] **A condition step before `HARW-didnotbuy`**, in "HARW Email Sequence",
      between the sequence and the tag: apply only when `HARW-purchased` is
      absent. Unsubscribing from a sequence is not the same as leaving the
      automation, and Kit will most likely advance to the tag step regardless.
      The "HARW Purchase" automation cannot cover this, because it runs at
      purchase time and removes a tag that has not been applied yet
- [ ] **Remove `in-HARW-sequence` at the end of "HARW Email Sequence"**, in the
      step *after* `HARW-didnotbuy` is applied. The tag is currently removed only
      on purchase, so every non-buyer keeps it forever and the cron re-reads the
      entire historical list through a rate-limited API ninety-six times a day.
      Minting already happened on day 0, so nothing downstream needs it. Order
      matters: remove it after the tag step, not before, or the subscriber may
      leave the automation before being tagged. "HARW Purchase" removing the same
      tag then becomes a harmless no-op
- [ ] **Activate "HARW Email Sequence" and "HARW Purchase".** Both are toggled
      off. Inactive automations do not accept subscribers, and switching one on
      later does not retroactively enrol anyone whose trigger already fired.
      **"Nobody is in flight today" expired. As of 2026-09-13 there are 40.**
      They finished nurture, were tagged `in-HARW-sequence` by the handoff
      automation, and have received nothing because the sequence automation is
      still off. Activating it will not reach them: their trigger already fired.
      They need the tag removed and re-applied once everything else is live, and
      that has to happen BEFORE `MINT_OFFERS_ENABLED` is set, or they spend
      their one `reformer-nurture` offer on a window with no emails behind it.
      Verify the "does not retroactively enrol" behaviour with one test
      subscriber first -- the whole remediation depends on it being true
- [ ] **Decide on the leftover transactional email.** `api/springs101.js` already
      sends a magic link through Resend at claim time, and that is the email that
      actually gets them into the portal. A Kit email covering the same moment
      either repeats it or, opened first, sends them to
      `/portal/spring-load-calculator` with no session. Cutting it also moves
      cart open a day earlier, at no cost

### Why email 4 cannot send immediately

Two independent reasons, both closed by the same one-day delay.

**The token will not exist yet.** "HARW Email Sequence" fires the instant
`in-HARW-sequence` lands and enrols the subscriber immediately. The cron polls
every 15 minutes. A zero-delay email 4 can go out before `offer_token` has been
written back to Kit, and the merge field renders blank in the one email that has
to carry the link.

**The window math depends on it.** `expires_at = end_of_day(tag_date + 4 days)`,
and email 4 says "4 days." That is only true if the tag lands on day 0 and email
4 lands on day 1, giving the reader days 1 through 4 in full.

Express it in **days, not hours.** Per the Timeline section, day-based delays
respect the sequence schedule and hour-based delays bypass it.

## Page map

| Route | Audience | Price shown | Indexed |
|-------|----------|-------------|---------|
| `/education` | Public | none, a card only | yes |
| `/how-a-reformer-works` | Public | $69 | yes |
| `/offer/reformer?t=TOKEN` | Email only | $39 + countdown | **noindex** |
| `/workshops/how-a-reformer-works` | Nobody, by design | redirect | no |
| `/portal/how-a-reformer-works` | Buyers | none | no |

The offer page must carry `noindex`. The spec's framing rule is that the public
page shows $69 only. If Google surfaces a $39 page, $69 stops reading as real
to anyone who browses.

**There is no mechanism for this yet.** The app has no `public/robots.txt` and
nothing that manages meta tags, so `noindex` cannot be written the obvious way.
Send it as a header instead: a `headers` block in `vercel.json` setting
`X-Robots-Tag: noindex` on `/offer/(.*)`. That holds regardless of the SPA
rewrite, which a client-rendered meta tag depends on Googlebot executing.

**`/workshops/how-a-reformer-works` has to redirect, not render.** Left alone it
resolves: `BrandedWorkshopRedirect` falls through to the generic
`WorkshopSalesPage` for any slug it does not recognise, which would publish a
second indexable $69 page for the same product. See Phase 1.

### Three pricing blocks, not two

The visitor sees three different sales pages. Two of them show $69, and they
are **not the same page**.

| Page | Price | Says about the discount |
|------|-------|-------------------------|
| `/how-a-reformer-works` | $69 | Nothing. Ever. |
| `/offer/reformer?t=X` **active** | $39 | Countdown, deadline named |
| `/offer/reformer?t=X` **expired** | $69 | "Your window closed Thursday" |

The public page must never acknowledge that a discount exists. The expired page
has to, or the visitor thinks the link was broken.

**Do not redirect the expired state to the public page.** It is the tempting
one-line implementation and it throws away the only thing that makes the
expired state work. Someone clicked a link promising $39 and landed on a page
saying $69 with no explanation. That reads as a bait and switch even though
nothing dishonest happened.

---

## Phase 0: Data model — partly shipped

**The course row shipped, under the course plan rather than here.**
`044_courses.sql` adds `'course'` to `webinars_kind_check` and brings the
curriculum tables; `045` seeds the course at $69 with
`kit_tag = 'HARW-purchased'` and its eight modules; `047` and `048` move an
already-seeded dev row onto the new slug and the renamed tag; `049` clears
`npcp_cecs`. The `kit_tag` trap described here was real and is now recorded in
045's own header comment: seed a different string and buyers keep receiving the
sales sequence for a course they already own, silently.

`status = 'live'` also shipped as described, and the reasoning is now a comment
in `api/checkout/create-session.js` so nobody "fixes" it.

**The offer table is the only migration this plan still owns**, and it is
**`050`**, not 043: 042 and 043 went to activity logging, and 044 through 049 to
the course.

- [ ] **Migration `050_subscriber_offers.sql`**

```sql
create table public.subscriber_offers (
  id uuid primary key default gen_random_uuid(),
  offer_key text not null,
  email text not null,
  token text not null unique,
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  expires_at timestamptz not null,
  first_seen_at timestamptz,
  redeemed_at timestamptz,
  redeemed_email text,
  recovery_sent_at timestamptz,
  kit_synced_at timestamptz,
  created_at timestamptz not null default now(),
  constraint subscriber_offers_redeemed_pair
    check (redeemed_email is null or redeemed_at is not null)
);

-- One offer per person per campaign. Case-folded, deliberately.
create unique index idx_subscriber_offers_person_campaign
  on public.subscriber_offers (offer_key, lower(email));

create index idx_subscriber_offers_open
  on public.subscriber_offers (expires_at) where redeemed_at is null;
create index idx_subscriber_offers_unsynced
  on public.subscriber_offers (kit_synced_at) where kit_synced_at is null;
create index idx_subscriber_offers_email
  on public.subscriber_offers (lower(email));
```

**Uniqueness is folded to lower case, and that is not cosmetic.** A plain
`unique (offer_key, email)` is case-sensitive, and Kit returns whatever the
subscriber typed at signup. `Sarah@Studio.com` and `sarah@studio.com` would be
two rows, two tokens and two four-day windows for one person in one campaign,
and the cron's dedup step would not catch it because it reads the same
constraint. This was caught by running the migration rather than by reading it.

`idx_subscriber_offers_email` exists separately because the unique index leads
with `offer_key` and the recovery route knows only an email.

Service-role RLS only. The offer page reads through an API route and never
queries this table from the browser.

Two columns carry decisions made on 2026-09-13 and are worth reading together
with the sections that explain them:

- **`redeemed_email`** is the address that actually paid, stamped by the webhook.
  It is a record, never a gate. Forwarded links are allowed to work, and this is
  how you find out how often they do. See Phase 3
- **`recovery_sent_at`** throttles the recovery email to one send per row per
  fifteen minutes. See Phase 2d

Keep `offer_key` distinct per campaign: `reformer-backfill-2026-09` against
`reformer-nurture`, chosen by the `HARW-backfill` tag. The unique index then
does the right thing: nobody gets two offers inside one campaign, but a future
re-run is not silently blocked by a row from a year ago.

---

## Phase 1: Sales page and pricing blocks — shipped

**Shipped in `c8b515c`, built as specified below.**
`src/components/course/CourseSalesBody.jsx` and `PricingBlock.jsx` exist,
`HowAReformerWorks.jsx` renders them at `/how-a-reformer-works`, `workshopUrl`
and `BrandedWorkshopRedirect` were generalised, and the `/education` card is in
place.

**One thing is deliberately unfinished:** `PricingBlock` ships the public variant
only, plus an already-owned state and an "opening soon" state for a row with no
`stripe_price_id`. The Active and Expired variants are Phase 2 work, and the
component was split out precisely so they land as a new branch rather than a
second copy of the page. The copy drafts below are still their spec.

The body of all three pages is identical: the eight-module outline, the design
story, the objection handling, the bio. Only the hero and pricing block change.
Build it that way from the start, or you will maintain three copies of the same
long page and they will drift.

```
<CourseSalesBody />        // written once, nearly the whole page
  └─ <PricingBlock />      // the only part that varies
       ├─ PublicPricing    // $69, no discount context
       ├─ ActivePricing    // $39, live countdown
       └─ ExpiredPricing   // $69, window-closed context
```

`/how-a-reformer-works` renders `CourseSalesBody` with `PublicPricing`.
`/offer/reformer` renders the same body and picks Active or Expired from what
`/api/offer` returned. Three pages to the visitor, one sales page to maintain.

- [x] ~~`src/components/course/CourseSalesBody.jsx`~~

Build it bespoke, in the shape of `PilatesPhysics101.jsx`, rather than through
the generic `WorkshopSalesPage`. The eight-module outline and the design-story
framing need real layout.

- [x] ~~`src/components/course/PricingBlock.jsx`~~ Built with the public
      variant. The other two come in Phase 2

- [x] ~~`src/pages/HowAReformerWorks.jsx`~~, routed at `/how-a-reformer-works`.
      Buy button posts to the existing checkout with no `offerToken`, and
      `allow_promotion_codes: true` stays on for this path.

- [x] ~~**Teach `workshopUrl` about the course, and loosen the redirect guard.**~~
      Two lines that fix two things.

```js
// src/lib/workshop.js
if (slug === 'how-a-reformer-works') return '/how-a-reformer-works'

// src/App.jsx, BrandedWorkshopRedirect
if (url !== `/workshops/${slug}`) return <Navigate to={url} replace />
```

`workshopUrl` is already the single source of truth for "this slug has a
branded page," and PP101 and PP102 both rely on it. The current guard hard-codes
a `/pilates-physics` prefix, so a third branded page needs it generalised.

This is what makes `/workshops/how-a-reformer-works` redirect instead of
rendering a duplicate sales page. It also repairs the full-price `cancel_url`
for free, because `create-session.js` sends abandoned checkouts to
`/workshops/{slug}` and that path now lands on the real page. Only the offer
path needs the API to do anything, which is Phase 3.

- [x] ~~Add a card to the `PATHS` array in `src/pages/Education.jsx`~~

It slots between the spring calculator and PP101, which is the ladder the spec
describes. **The CEC arrived after all:** NPCP approved 1 CEC on 2026-09-11, so
migration 051 reverses 049 and the card meta now reads
`$69 · 1 hour · 1 NPCP CEC`. 051 seeds all three NPCP fields together -- course
id `20245-10188`, approved 2026-09-11 -- because the certificate prints the
block once any one of them is set, so a partial fill would render em dashes on a
credential.

### Pricing block copy

Drafts, not final. The jobs each one has to do are the point.

**Active.** Names the price, the deadline, and what happens after, so the
countdown is a fact rather than a pressure tactic.

> **$39** for the next **2 days, 14 hours, 03 minutes**
>
> Your window closes Thursday, August 27 at 11:59pm Pacific.
> After that the course is $69. Same course, same everything.

**Expired.** Does more work than it looks like. It confirms the discount was
real, confirms the product was never gated behind it, and removes any suspicion
that $39 was a trick. That protects $69 instead of undermining it.

> Your $39 window closed on Thursday.
>
> The course is $69. Nothing about it has changed. Every module, the
> calculator, and the inspection checklist are all still included, exactly as
> they were.

**The CEC belongs in that list again.** It was removed on 2026-09-08 when the
course was going to ship without one; NPCP approved 1 CEC on 2026-09-11, so the
expired copy should name it alongside the modules, the calculator and the
checklist. The rule behind both edits is the same: this is the one page whose
entire job is proving nothing dishonest happened, so the list has to be exactly
true on the day it renders.

**Public.** No mention of any of the above.

---

## Phase 2: The offer machinery — code shipped, manual steps outstanding

**Built 2026-09-13.** Everything in this phase that is code exists and builds.
What is left is 2a and 2b, which are dashboard work.

| File | What |
|---|---|
| `api/_lib/offer.js` | `endOfOfferWindow` and `formatDeadline` added beside `isOfferValid` |
| `api/_lib/kit.js` | `listSubscribersByTag`, `updateSubscriberFields` |
| `api/cron/mint-offers.js` | **New.** The minting job |
| `api/offer.js` | **New.** The four states |
| `api/offer/recover.js` | **New.** Mails the link, never renders it |
| `api/_lib/resend.js` | `sendOfferLinkEmail` |
| `src/pages/OfferPage.jsx` | **New.** Routed at `/offer/reformer` |
| `src/components/course/PricingBlock.jsx` | Active and Expired variants |
| `vercel.json` | The cron, `maxDuration: 60`, and the `X-Robots-Tag` header |

**Kit's API was checked rather than assumed.** Three facts came back that this
plan had not accounted for, and each changed the code:

- **Pagination is by cursor, not page number.** `listSubscribersByTag` takes an
  `after` cursor, not `{ page }` as this plan originally specified
- **The rate limit is 120 requests per rolling 60 seconds** per API key. That is
  what sets `MAX_WRITES_PER_RUN = 40` at one write per 600ms, comfortably inside
  the 60s `maxDuration`, and still 3,840 offers a day at a 15-minute cadence
- **An unknown custom-field key is not an error.** Kit accepts the write,
  ignores the key, and mentions it in a `warnings` array. So
  `updateSubscriberFields` **throws on warnings**: without that, a missing
  `offer_token` field would look like success, the cron would stamp
  `kit_synced_at`, and the merge field would render blank in the one email that
  carries the link, silently, for everyone

**The clock anchors on `tagged_at`, not on mint time.** The subscriber listing
already returns it, so it costs nothing, and it is what the decisions table
means by "clock start: when the Kit tag is applied". One guard on top: if
honouring `tagged_at` would hand someone a window with under two days left —
which happens only after a multi-day cron outage — the cron re-anchors to now
and logs it. A link that works beats a link that apologises for our downtime.

### 2a. Stripe setup, one time

- [ ] Create a second Price on the course product at $39. This is the same
      Price the PP101 order bump will use. Store the id as
      `TRIPWIRE_OFFER_PRICE_ID`.

### 2b. Kit setup, manual, in the dashboard

The tags, sequences, and automations already exist. See "The Kit flow as built"
for the structure and for the five changes it still needs. What is missing here
is only the pair of custom fields.

- [ ] Custom fields: `offer_token`, `offer_deadline`. **Create these before the
      first cron run.** `updateSubscriberFields` throws rather than pretending to
      succeed, so until they exist every row simply stays in the retry queue —
      but nothing mints into Kit either
- [ ] Everything under "What still has to change"

**No new tag is needed.** `in-HARW-sequence` is the trigger the cron polls, and
the "Spring Calc Welcome" automation already applies it at exactly the right
moment: after nurture completes, before the cart sequence begins.

The cron interval alone would only require a fifteen-minute gap between that tag
and email 4. The one-day delay on email 4 buys a full overnight instead, which is
the difference between "usually fine" and "cannot race."

### 2c. `api/cron/mint-offers.js`

- [x] ~~Add to the `crons` array in `vercel.json` alongside `publish-scheduled`~~
      Done, with `maxDuration: 60` for this function
- [x] ~~Reuse the `CRON_SECRET` bearer check from `publish-scheduled.js` verbatim~~

Each run:

```
1. GET Kit subscribers tagged `in-HARW-sequence`
2. filter out: existing subscriber_offers rows for this offer_key
               users already holding a course entitlement
3. insert up to 100 offer rows,
   offer_key  = 'reformer-backfill-2026-09' if the subscriber also carries
                `HARW-backfill`, else 'reformer-nurture'
   expires_at = end_of_day(mint_date + 4 days) in America/Los_Angeles
   **Not now() + 72h. See "Timeline" below: a ragged afternoon deadline
   contradicts "today," "tomorrow," and "midnight" in the copy.**
4. PUT offer_token + offer_deadline back to Kit, throttled
5. stamp kit_synced_at
```

**`offer_key` comes from the backfill tag, and nothing else.** Both cohorts enter
through the same `in-HARW-sequence` tag, so without `HARW-backfill` the cron has
no way to tell them apart and the two keys in Phase 0 would be decoration. Step 1
should therefore read both tags in one pass, or read the backfill tag's members
once per run and use it as a set.

**`offer_deadline` is a human string, not a timestamp.** Kit does not format a
merge field: whatever is written is what the reader sees in email 8. Build it
from the same `end_of_day` value that sets `expires_at`, formatted in
`America/Los_Angeles` with the zone named:

```js
// "Thursday, September 17 at 11:59pm Pacific"
const deadlineLabel = `${new Intl.DateTimeFormat('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
  timeZone: 'America/Los_Angeles',
}).format(expiresAt)} at 11:59pm Pacific`
```

Write `expires_at` to the database and `deadlineLabel` to Kit, from one
computation. Two formatters drifting apart is how the copy and the enforcement
stop agreeing, which is the entire problem the Timeline section exists to solve.

**There is no cursor.** An earlier draft tracked one, which meant storing cron
state the schema has nowhere to put, and getting the advance ordering exactly
right so a mid-batch failure could not orphan rows holding a token nobody
received. Drop it. The unique index on `(offer_key, lower(email))` already makes
step 2 idempotent,
so re-reading the same subscribers costs one wasted query and nothing else. A run
that dies halfway is picked up fifteen minutes later, and the rows whose
`kit_synced_at` is still null are the retry queue. That is what the partial index
in Phase 0 exists for.

The 100-row cap is not optional. Vercel caps function duration and a few
thousand Kit field writes will not finish in one invocation. Kit rate-limits
the v4 API, so add a delay between writes and verify the current ceiling in
their docs before settling on a batch size.

- [x] ~~Two new functions in `api/_lib/kit.js`~~ Built, with two signature
      changes forced by the real API:
      - `listSubscribersByTag(tagName, { after, perPage })` — cursor pagination,
        not `{ page }`
      - `updateSubscriberFields(subscriberId, emailAddress, fields)` —
        `email_address` is required by `PUT /v4/subscribers/{id}` even when only
        fields change

### 2d. `api/offer.js` and `src/pages/OfferPage.jsx`

`GET /api/offer?t=TOKEN` returns one of four states:

| State | Condition | Page renders |
|-------|-----------|--------------|
| `active` | now < expires_at | `CourseSalesBody` + `ActivePricing` |
| `expired` | now > expires_at | `CourseSalesBody` + `ExpiredPricing` |
| `redeemed` | redeemed_at set | Link to the portal, no sales body |
| `unknown` | bad or missing token | Email-entry form that **mails** the link. See below |

**Keep this on one route, not two.** The state comes from server data, not from
the URL. If the URL carries it, someone bookmarks the active URL, hits it on
Saturday, and the redirect logic has to exist anyway. One route, four states,
server decides.

The `unknown` state matters more than it looks. Corporate scanners that strip
query strings, a bare bookmarked `/offer/reformer`, and anyone retyping the URL
all land there, and it recovers those people instead of dead-ending them at the
moment they decided to buy.

**It must mail the link, not render the offer.** Decided 2026-09-13. The obvious
build — type an email, see $39 — turns this route into a page that hands the
discount to any address entered into it, which is exactly the coupon code that
"Why there is no Stripe coupon" takes credit for eliminating. One post in a
studio Facebook group and the token stops meaning anything.

- [x] ~~**`POST /api/offer/recover`**, taking `{ email }`~~

```
1. look up subscriber_offers by email, newest row
2. no row, or already redeemed  -> return 200, send nothing
3. recovery_sent_at within 15m  -> return 200, send nothing
4. row is still open            -> mail the link
   row has expired              -> mail the window-closed note instead
5. stamp recovery_sent_at, return the same 200 either way
```

**Answer identically whether or not the address was found.** The response never
confirms that an email is on the list, and the only inbox a link can reach is the
one it was minted for. Typing a colleague's address mails the colleague.

**An expired row gets an email too, and this is the point.** Sending nothing
leaves someone who was told "check your inbox" staring at an inbox that never
fills, which is the dead end this route exists to remove. Mail them the same
thing the expired pricing block says: the window closed, the course is $69,
nothing about it changed, here is the link. It reveals nothing the active case
does not, because the response the browser sees is identical in both.

A redeemed row sends nothing. They already own the course, and the portal link
belongs in the purchase email, not here.

- [x] ~~**`sendOfferLinkEmail({ to, url, deadlineLabel, expired })` in `api/_lib/resend.js`**~~

Follow `sendContactAcknowledgement`: inline HTML and text built in the function,
`escapeHtml` on anything interpolated, the shared `FROM`. No template file. The
magic-link template is the exception in that file, not the pattern, and it exists
only because Supabase's hosted email shares it.

Body: here is your link, it closes on `deadlineLabel`, one button. Print the
deadline from the same value the cron wrote to Kit.

**`recovery_sent_at` is the whole rate limit, and it is enough.** There is no
rate-limiting infrastructure in the app today and this route does not need any:
no email is sent unless a matching offer row exists, so the blast radius is
bounded to addresses already on the list, and the column caps each of those at
one send per fifteen minutes. An attacker enumerating addresses learns nothing
from a response that never varies.

**The page copy after submitting:** "If you have an open window, the link is on
its way to that inbox." Same sentence in every case.

Stamp `first_seen_at` on the first `active` hit, for analytics only. It is
never used for enforcement.

The countdown on the page is decoration. The client clock is a suggestion.
Enforcement happens server-side in Phase 3.

Keep checkout reachable in the `expired` state, at $69. Someone whose window
closed Thursday and decides to buy on Saturday should be able to.

### Missed-the-window requests

Someone will email saying "I missed it by an hour, can I still get $39?"

Keep that a human decision, not a feature. An admin action that regenerates
their offer row with a fresh `expires_at`, used sparingly. What must not exist
is an automatic "click here to reopen your window," because a window that
reopens on request is not a window, and word travels fast in this industry.

---

## Phase 3: Checkout — shipped

**Built 2026-09-13.** Four changes to `api/checkout/create-session.js`, one to
provisioning, one to the client hook, plus a new pure module and its test:

| File | What |
|---|---|
| `api/_lib/offer.js` | **New.** `isOfferValid(row, workshopId, now)` — the whole enforcement predicate, extracted so it is testable without Stripe or Supabase |
| `api/checkout/create-session.js` | Accepts `offerToken`, validates, 410s, branches the price, rewrites `cancel_url`, carries `offer_id` |
| `api/_lib/provision-purchase.js` | Stamps `redeemed_at` and `redeemed_email` |
| `src/hooks/useCheckout.js` | Takes `{ offerToken }`, handles 410 as a new `offer_expired` state |
| `scripts/test-offer-checkout.mjs` | **New.** 12 cases over the predicate, all passing |

**The predicate moved out of the handler on purpose.** Inline, the only way to
test it was to stand up Stripe and Supabase, which means in practice it would
never have been tested. As a pure function over a row it runs in a second, and
`now` is injectable so the expiry boundary is testable without waiting.

**The test was mutation-checked, not just run.** Deleting the `webinar_id`
binding fails "a reformer token cannot buy PP-101"; relaxing the boundary to
`>=` fails "the expiry instant itself is closed". Both regressions are caught,
which is the only evidence that a green run means anything.

- [x] ~~**Accept an optional `offerToken` and re-validate it server-side.**~~ Never
      trust that the page said it was valid. The client clock is a suggestion and
      the countdown is decoration; this check is the entire enforcement layer.

**All four conditions, not just expiry:**

```js
const { data: row } = await supabaseAdmin
  .from('subscriber_offers')
  .select('id, token, webinar_id, expires_at, redeemed_at')
  .eq('token', offerToken)
  .maybeSingle()

const offer =
  row &&
  row.webinar_id === workshop.id &&      // 1. bound to THIS product
  !row.redeemed_at &&                    // 2. not already used
  new Date(row.expires_at) > new Date()  // 3. still open
    ? row
    : null                               // 4. exists at all
```

The `webinar_id` check is the one that is easy to skip and expensive to miss.
Without it, a valid reformer token passed against the PP101 slug sells PP101 for
$39, because the price branch keys off the token rather than off the product.

**There is deliberately no fifth condition matching the buyer's email.** Decided
2026-09-13. A forwarded link buys at $39 under whatever address the buyer types,
and that is allowed. Requiring `row.email === resolvedEmail` would 410 the person
whose Kit address is their gmail and whose card sits on their studio address,
with no explanation they could act on — the bait-and-switch the expired pricing
block exists to prevent, aimed at a real customer instead of a freeloader.
Leakage is bounded by one token per subscriber and a four-day window, and every
leaked sale is still revenue at a price set here. Record it instead of blocking
it: the webhook stamps `redeemed_email`, and if the mismatch rate climbs the
decision can be revisited against numbers rather than a guess.

**The redemption race is accepted, not fixed.** `redeemed_at` is checked here, at
session creation, and stamped in the webhook after payment. Between those two
moments a second checkout session can be opened on the same token, so two
simultaneous sessions can both pay. Once one purchase completes the webhook
closes the token and every later attempt fails, which leaves only the
two-tabs-at-once case. Reserving at session creation would need a TTL and a
`checkout.session.expired` release to avoid locking a buyer out of their own
token after an abandoned checkout — real machinery for a rare $30 edge. If it
ever shows up in the data, `redeemed_email` is where it will be visible.

**An invalid token is a 410, not a silent fallthrough.**

```js
if (offerToken && !offer) {
  return res.status(410).json({ offerExpired: true })
}
```

**It cannot be a 409, which is what this plan said until 2026-09-13.**
`useCheckout` already treats every 409 from this route as "you already own
this": it reads `portalUrl`, falls back to `/portal/{slug}`, and sets
`already_enrolled` without ever looking at the body. An expired token returning
409 would tell someone they own a course they have not bought and send them to a
portal page they have no entitlement for. 410 Gone is the honest code and it
does not collide.

The tempting version drops them to full price and carries on. Do not. Someone
whose window closed while the tab sat open would see $39 on the page and $69 on
the Stripe receipt, which is the exact bait-and-switch the expired pricing block
exists to prevent. Return the 409, let `OfferPage` re-fetch and re-render as
expired, and make them click $69 deliberately.

- [x] ~~**Branch on price, and turn off stacking:**~~

```js
const priceId = offer
  ? process.env.TRIPWIRE_OFFER_PRICE_ID
  : workshop.stripe_price_id
```

Set `allow_promotion_codes: false` on the offer path, so no other active
promotion code can stack on top of $39.

- [x] ~~**Send cancelled offer checkouts back to the offer page.**~~ The URLs were
      currently hard-coded to `/workshops/{slug}`:

```js
cancel_url: offer
  ? `${origin}/offer/reformer?t=${offer.token}`
  : `${origin}/workshops/${slug}`,
```

Build it from the validated row, never from anything the client posted, or the
parameter becomes an open redirect. The full-price branch needs no change once
Phase 1 lands, because that path now redirects to the real page.

`success_url` stays as it is. `/workshops/:slug/success` is its own route rather
than part of the branded redirect, and `RegistrationSuccess` is already
slug-generic: it polls `verify-session` and links to `/portal/{slug}`.

- [x] ~~**Add `offer_id` to session metadata**~~ so provisioning can close the loop.

- [x] ~~**Comment the status gate.**~~ Done. `create-session.js` now carries the
      "courses sit at 'live' permanently" note above its `upcoming | live`
      check, with an explicit instruction not to "fix" it by excluding `live`.

- [x] ~~**Webhook:**~~ Built **inside `provisionPurchase` itself**, not in
      `api/stripe/webhook.js`. That function is the documented funnel every
      provisioning path goes through, so a purchase provisioned by any other
      route cannot leave a spent token still spendable. Guarded with
      `.is('redeemed_at', null)` so the retries it is designed for cannot
      overwrite the original payer, and non-fatal so a stamp failure never makes
      Stripe retry a purchase that succeeded. Everything else already works unchanged, because the course is
      just another `webinars` row: account creation, entitlement grant, and Kit
      tagging via `kit_tag`.

- [x] ~~**Write a test for the expiry check.**~~ `scripts/test-offer-checkout.mjs`,
      12 cases, mutation-checked. It is the only thing standing between an
      expired token and a $30 discount.

---

## Phase 4: Customer portal — shipped

**Built under the course plan, not this one.** `PortalDashboard` groups courses
into their own section, `WorkshopPortal` branches to a course renderer, and
`src/components/portal/course/` holds `CoursePlayer`, `ModuleList`, `CourseQuiz`
and `VimeoEmbed`.

**The `course_progress` SQL that used to sit here was wrong, and has been
deleted rather than ticked off.** It keyed on `(user_id, content_id)`, hanging
progress off `webinar_content`. What shipped in `044_courses.sql` keys on
`(user_id, module_id)` against a `course_modules` table, because the curriculum
is its own thing: sharing one table would have entangled module numbering with
attachment ordering and let a downloadable worksheet count as a module.
`webinar_content` survives for attachments and gained a nullable `module_id`, so
a resource can hang off one module or off the course as a whole.

Two other assumptions from this phase also turned out differently, and both are
worth knowing before writing anything against these tables:

- **Progress is a bookmark, not proof of study.** Modules are freely navigable
  and Next marks one done without watching anything. The record that carries a
  certificate is a passed `quiz_attempts` row, which is the only thing here that
  cannot be clicked through
- **The CEC is real, but `course_progress` is still not what carries it.** This
  phase justified the table by the CEC completion requirement, and NPCP did
  approve 1 CEC on 2026-09-11 (migration 051). The record behind the credit is a
  passed `quiz_attempts` row, though -- the only thing here that cannot be
  clicked through. `course_progress` earns its place for resume, the progress
  bar, and the soft prompt on the quiz

---

## Phase 5: Content shell — shipped

The eight modules are seeded by `045` with titles, summaries and runtimes and a
null `vimeo_url`, which renders "coming soon" rather than breaking the player.
The machinery therefore already stands against placeholder content, which is
exactly what this phase asked for: videos are the long pole and they never
blocked the plumbing.

The quiz shipped too, which this plan had tabled as the one real build:
`QuizEditor` in the admin, `api/course/quiz.js` grading server-side against an
answer key RLS denies to learners, `CourseQuiz` in the portal, and
`quiz_attempts` as the audit trail. The six questions are typed into the Quiz
tab rather than seeded, because a migration is the wrong home for copy that gets
revised.

The spec's interactive tool list (parts diagram, adjustment simulator, load
curve animation) is still its own project, and the rule that content never
changes as an urgency lever still holds.

---

## Timeline: making Kit's send times and Stripe's deadline agree

The copy names a deadline. The database enforces one. Nothing checks that they
are the same deadline, and as currently specified **they are not.** This section
resolves that and fixes the send hour.

### What Kit can actually do

Confirmed against Kit's own documentation, and the second row is the one that
decides the design:

| Capability | Reality |
|---|---|
| Set the hour a sequence email sends | Yes. Sequence-level default under Settings, "Email Sequence Schedule," plus a per-email override in the Content tab |
| Delays measured in **days** | **Respect** the schedule. The email lands in your chosen window |
| Delays measured in **hours** | **Bypass** the schedule. The email fires whenever the delay expires, whatever the clock says |
| Precision | Kit checks for due sequence emails every 15 minutes, so a 9:00am send lands around 9:00 to 9:15 |
| Timezone | Account default is Eastern. Per-sequence override available. Broadcasts cannot override; sequences can |
| Send days | Selectable per sequence and per email, so weekends can be excluded or allowed |

**So the 11pm problem is solved, on one condition: every delay in the sequence
is expressed in days, never hours.** A subscriber who opts in at 11pm still gets
their emails at 9am, because a day-based delay waits for the schedule window. The
moment any delay is set in hours, that subscriber's whole sequence inherits their
11pm signup time and never recovers.

**The one deliberate exception is email 8,** which has to land the same evening
as email 7. Give it an **11-hour delay** from email 7. Because it is hour-based it
bypasses the schedule, and because email 7 is schedule-anchored at 9am the offset
lands at about 8pm. Email 7 slipping drags email 8 with it, which is the correct
behaviour: the gap holds and it stays an evening send.

**Test the days-versus-hours behaviour before trusting it.** One test subscriber
added at 11pm, day-based delays throughout, and confirm email 1 arrives the next
morning rather than at 11:15pm. The entire schedule rests on this.

### The mismatch to fix

Phase 2c currently mints `expires_at = now() + 72h`, where `now()` is whenever
the cron happened to run. That produces the ragged deadline in the Phase 1 copy
draft: *"Your window closes Thursday, August 27 at 4:12pm."*

The emails say something different. Email 6 says "$39 until tomorrow." Email 7
says "$39 today." Email 8's subject is "$39 ends at midnight." **A ragged
afternoon expiry makes all three of those false**, and email 8 is the worst case:
it goes out at 8pm promising midnight, against a window that closed at 4:12pm.
Every click in that email lands on the expired page.

**Fix: stop deriving the deadline from `now()`. Round it to end of day.**

```
expires_at = end_of_day(mint_date + N days)   // 23:59:59, fixed timezone
```

Everything downstream becomes true at once. "Until tomorrow" is true. "Today" is
true. "Midnight" is true. The offer page countdown reads "closes Thursday at
11:59pm" instead of naming a minute nobody chose.

**Anchor the timezone west.** Set the deadline at 23:59:59 **Pacific** and name
it once in email 8 and on the offer page. Everyone east of Pacific gets their
"midnight tonight" honoured and then some, because their midnight arrives before
the cutoff. The only subscribers who lose time against the literal copy are in
Hawaii and further west, which is a small enough population to accept. Anchor to
Hawaii instead if you would rather it be exactly true for everyone.

### The window is four calendar days. Decided 2026-08-21.

Five emails have to fit inside it: 4, 5, 6, 7, 8. At one send per morning plus
the evening close, that is four calendar days, not three. The earlier 72-hour
figure could not hold five sends and has been retired.

| Email | Day | Time | What the copy says |
|---|---|---|---|
| 4 | 1 | 9am | cart opens, "4 days" |
| 5 | 2 | 9am | "two more days" |
| 6 | 3 | 9am | "$39 until tomorrow" |
| 7 | 4 | 9am | "$39 today" |
| 8 | 4 | 8pm | "$39 ends at midnight" |

Every line of shipped copy is true against this. Email 4 was updated from "3
days" to "4 days," which was the only copy change required. **Kaleen's edit to
email 6 was the tell:** she changed it to "until tomorrow," which only works if a
day exists after it, and that instinct is what surfaced the conflict.

**"Four days" means calendar days, not 96 clock hours.** Because the deadline is
minted as end of day, a subscriber whose email 4 lands on day 1 at 9am has until
day 4 at 11:59pm, which is a little under 96 hours. That is the right direction to
err. The copy promises four days a reader can count on a calendar and the
mechanism delivers all four of them in full, while giving slightly less clock time
than a literal reading of "96 hours" would imply. **Never describe the offer in
hours in customer-facing copy.** Days are what is promised and days are what is
enforced.

### Two sequences, with the handoff in an automation

Already built this way. "The Kit flow as built" has the exact structure: Spring
Calc Welcome carries nurture, the How a Reformer Works sequence carries the cart,
and the automation between them applies `in-HARW-sequence`.

What the schedule still needs:

- **All seven days enabled on the cart sequence, no exclusions.** The deadline is
  wall-clock and does not pause for Saturday. Exclude weekends and a subscriber
  whose email 6 slides to Monday has a window that expired Sunday with no
  reminder ever sent. Weekday-only is safe on nurture, because nothing there is
  on a clock
- **A one-day delay on email 4,** in days. See "Why email 4 cannot send
  immediately"
- **9am sequence schedule, every delay in days** except email 8

The handoff tag cannot move earlier, to sequence entry. The clock starts when it
is applied, and nurture runs for the better part of a week before the cart opens.
Tag on entry and the window expires days before email 4 ever mentions it.

### Print the deadline, do not hard-code it

`offer_deadline` already exists as a Kit custom field in Phase 2b, and it is
currently unused by the copy. Use it. Email 8's body should read the deadline
from the merge field rather than asserting "midnight" in prose, so that any drift
between Kit's send window and the minted deadline is self-correcting rather than
a lie in the reader's inbox.

Subject lines are the exception. Kit renders merge fields in subjects, but a
blank field produces a broken subject line and there is no way to catch it after
send. Keep "$39 ends at midnight" static in the subject, put the precise,
timezone-named deadline in the body.

**Give the body a fallback anyway.** The same blank-field risk applies there,
just less catastrophically: a mint that succeeded while the Kit write failed
leaves `offer_deadline` empty and the sentence collapses. Liquid closes it —
`{{ subscriber.offer_deadline | default: "tonight at 11:59pm Pacific" }}` — and
the fallback is true for every reader of email 8 regardless, because email 8
sends on day 4.

**The field holds a human string**, written by the cron as
"Thursday, September 17 at 11:59pm Pacific". Kit formats nothing. See Phase 2c
for the formatter and the rule that one computation feeds both `expires_at` and
this label.

### What to change, in order

- [x] ~~Decide the window length.~~ **Four calendar days, 2026-08-21**
- [x] ~~Email 4 copy: "3 days" becomes "4 days"~~ **Done**
- [x] ~~Spec offer terms and the sequence cadence table~~ **Done**
- [x] ~~Phase 1 active pricing block: replace the "4:12pm" example with an
      end-of-day deadline~~ **Done**
- [x] ~~Kit: two sequences with the handoff between them~~ **Built**

Code:

- [ ] Cron: `expires_at = end_of_day(mint_date + 4 days)` in
      `America/Los_Angeles`, replacing `now() + 72h`
- [x] ~~Migration 042: `kit_tag = 'HARW-purchased'`, matching Kit exactly~~
      **Done.** 045 seeds it; 048 moves any row still on `MOR-purchased`

Kit, all manual:

- [ ] One-day delay on email 4, expressed in days
- [ ] Condition step before `HARW-didnotbuy`, skipped when `HARW-purchased` is
      present
- [ ] Remove `in-HARW-sequence` in the step after `HARW-didnotbuy`, so the cron's
      poll set stops growing
- [ ] Create the `HARW-backfill` tag before the first wave
- [ ] Activate "HARW Email Sequence" and "HARW Purchase"
- [ ] `completed-nurture` step, or retire the tag
- [ ] Sequence schedule 9am, all delays in days
- [ ] Cart sequence enabled all seven days
- [ ] Email 8 as an 11-hour delay off email 7
- [ ] Email 8 body: deadline from `{{ subscriber.offer_deadline }}` with a `default:`
      fallback, timezone named
- [ ] Decide on the leftover transactional email

Tests:

- [ ] One subscriber added at 11pm. Confirm email 1 lands the next morning rather
      than at 11:15pm. The entire schedule rests on this
- [ ] One subscriber who buys mid-sequence. Confirm they stop receiving cart
      emails and do **not** end up tagged `HARW-didnotbuy`
- [ ] An expired token against `create-session.js`, already listed in Phase 3 and
      still the only thing between an expired link and a $30 discount

### How this interacts with the backfill

Barely, which is the point of a rolling per-subscriber deadline. Each wave mints
its own end-of-day deadline four days out from its own tag event, so staggering a
few dozen a day produces a steady trickle of windows rather than one spike. The
cron sees the same steady input either way.

The cohort enters differently from a new subscriber, though. They have already
completed nurture, so they are tagged straight into `in-HARW-sequence` and their
cart opens the next morning. A wave tagged Monday reaches email 4 on Tuesday, not
the following week.

---

## The backfill

238 subscribers have completed the Spring Calc Welcome sequence. The
`in-HARW-sequence` step was appended to that automation afterwards, so none of
them ever passed through it and Kit will not walk them back. **They cannot reach
the tripwire on their own.** Nothing about this is self-healing.

**Two tags, in order: `HARW-backfill` first, then `in-HARW-sequence`.** The second
is the entry point — the "HARW Email Sequence" automation picks them up on that
tag event exactly as it does a new subscriber, and they do not re-enter nurture,
which is right because they have already read emails 1 through 3.

`HARW-backfill` has to land **first**, because it does three jobs downstream and
all three read it after the clock has already started:

- gates the Liquid conditional on email 4's opening. See "The copy conflict"
- tells the cron to write `offer_key = 'reformer-backfill-2026-09'`. See Phase 2c
- retires the cohort: once the last wave clears, remove the tag and the
  conditional and the second `offer_key` both stop mattering

Applied the other way round, a fast cron run can mint the offer before the
backfill tag exists, and that subscriber gets the wrong `offer_key` and the
wrong email 4.

**Activate "HARW Email Sequence" before the first wave.** Inactive automations do
not accept subscribers. Tag a wave while it is switched off and that wave is
silently lost, with no way to re-fire the trigger short of removing the tag and
re-adding it.

**Exclude existing buyers.** Filter against `user_entitlements` before minting.
Sending a discount for something someone already owns is the kind of error people
screenshot.

**Stagger it, do not dump it.** Two reasons:

- *Deliverability.* This list opted in for a free calculator and has never
  received a sales email. Two hundred promotional sends in one hour is the shape
  spam filters look for
- *The deadline spike.* One tag event means one shared deadline, so every
  reminder and every purchase lands inside the same four days, then silence

Waves of a few dozen a day over a week or two. The cron does not care; it sees
the steady trickle it was designed for. This is a Kit scheduling decision, not
code.

### The copy conflict

Email 4 opens:

> Because you just joined my list, I want to give you the chance to buy this
> course for **$39**.

True for every future subscriber. False for all 238, some of whom ran the
calculator months ago and have just finished a nurture sequence. It reads as a
mail merge that did not check, in the email that has to earn the sale.

**The backfill needs its own email 4,** anchored to what they did rather than
when they joined: they ran the calculator, they got one spring's number, here is
the rest of the machine. Emails 5 through 8 are about the product rather than the
timing and ship unchanged.

Two ways to build it in Kit:

1. **A Liquid conditional on email 4's opening,** gated on `HARW-backfill`. One
   sequence to maintain, and it disappears on its own once the cohort clears.
   Test the render carefully: a Liquid error in a body fails quietly
2. **A duplicate cart sequence** differing only in email 4, entered by a separate
   backfill tag and retired afterwards. More to maintain for two weeks, and
   nothing subtle to get wrong

**Option 1, on the `HARW-backfill` tag.** Decided 2026-09-13. The tag is being
created anyway for `offer_key`, so the conditional costs nothing extra, and one
sequence that heals itself beats two that have to be kept in step. Preview it
against a test subscriber carrying the tag and one without, before the first
wave.

---

## Build order

The original order put the portal first, the sales page second and the offer
machinery last, so that nothing was discounted before the product existed and
sold at full price. That has happened. What is left runs straight through.

1. ~~**`050_subscriber_offers.sql`**~~ (Phase 0). **Written and validated**
   against a scratch PostgreSQL 18 cluster: constraints, policy and all three
   query shapes confirmed. Not yet pushed to dev
2. ~~**Checkout branch** (Phase 3)~~ **Done 2026-09-13.** Lint clean, 12/12 on
   the predicate test. Needs `TRIPWIRE_OFFER_PRICE_ID` in Vercel before the
   offer path can run: the route 500s loudly rather than quietly selling at $69
3. ~~**Offer machinery** (Phase 2)~~ **Done 2026-09-13**, except the Stripe $39
   Price, which is dashboard work. Cron, both API routes, the page and both
   pricing variants are built, linted and rendered
4. ~~**Recovery** (Phase 2d)~~ **Done.** `api/offer/recover.js` and
   `sendOfferLinkEmail`. Kept a separate step because it is the one piece that
   quietly becomes a discount dispenser if built the obvious way
5. ~~**`X-Robots-Tag: noindex`** on `/offer/(.*)` in `vercel.json`~~ **Done**,
   and set again by `api/offer.js` on its own response
6. **Kit**, all manual: the list under "What to change, in order" — **this is
   now the critical path**
7. **The backfill**, in waves, once everything above is live

**Checkout before the cron, reversing the original order.** The server-side token
check is the whole enforcement layer and the part that has to be right, and it
can be tested against a hand-inserted offer row long before anything mints one
automatically.

---

## Tabled: admin work

Not in this plan. Listed so it stays tracked, with a read on real cost given
what already exists.

| Item | Existing foundation | Cost |
|------|---------------------|------|
| Offer analytics: minted, clicked, bought, conversion by day of window | `AdminAnalytics.jsx` + `api/admin/analytics-summary.js` | Small. New query and panel, reading columns the offer table already has |
| Comp access for specific people | `grant-entitlement.js`, `bulk-grant-entitlement.js`, `AdminUsers.jsx` | Near zero. Already works for any `webinars` row |
| Reopen one person's window by hand | Nothing yet | Small. One admin action that resets `expires_at` on a `subscriber_offers` row. See "Missed-the-window requests" |
| Feedback survey | `webinars.survey_config` jsonb + `workshop_feedback.responses` jsonb (migration 025) + `AdminWorkshopFeedback.jsx` | Near zero. Migration 025 was built workshop-agnostic. Write a JSON config |
| ~~Graded quiz, 6 questions~~ | **Shipped.** `QuizEditor`, `api/course/quiz.js`, `CourseQuiz`, `quiz_attempts`, `quiz_pass_pct` on the product row | Done. The six questions are typed into the Quiz tab, not seeded |
| PDF worksheet and inspection checklist | `api/_lib/build-certificate.js`, pdfkit already a dependency | Medium. Design work more than code |
| Downloads | `webinar_content` type `download`, admin storage (migration 005) | Near zero. Seed rows |
| ~~Certificate~~ | **Shipped.** `api/certificate/[workshopId].js`, built at download time from the row | Done. Carries 1 NPCP CEC, course id `20245-10188`, approved 2026-09-11, all seeded by 051 |

The quiz and the certificate are done, which was the only entry here costed as a
real build. Everything still on this list is a config change, a seed row, or a
small panel reading columns that already exist. The six questions are drafted in
docs/how-a-reformer-works/npcp-cec-application.md, Section 10.

---

## Decided, 2026-09-13

The six things the review left open are settled and written into the phases
above. Recorded here so the reasoning is findable, and so a later reader knows
these were chosen rather than defaulted into.

| Question | Decision | Lives in |
|---|---|---|
| What `/offer/reformer` does with an unrecognised token | **Mail the link, never render the offer.** Identical response whether or not the address matched | Phase 2d |
| A forwarded link bought under a different email | **Allowed, and recorded** in `redeemed_email`. No fifth validation condition | Phase 3 |
| `redeemed_at` checked at session creation, stamped at webhook | **Accepted.** Only two simultaneous sessions can exploit it, and the fix costs more than the leak | Phase 3 |
| The cron's poll set never shrinks | **Remove `in-HARW-sequence`** in the step after `HARW-didnotbuy` | "What still has to change" |
| `offer_key` has no source | **The `HARW-backfill` tag**, which also gates email 4's Liquid conditional | Phase 2c, "The backfill" |
| `offer_deadline` format | **A human string** — "Thursday, September 17 at 11:59pm Pacific" — from the same computation as `expires_at`, with a Liquid `default:` fallback in email 8 | Phase 2c, "Print the deadline" |

Two of these are worth re-reading as a pair. Forwarded links are allowed and the
recovery route refuses to render an offer, which looks inconsistent until you
notice what separates them: a forwarded link was minted for a real subscriber and
leaks one seat at a time, while an email form that renders $39 leaks the price
itself to anyone who finds the URL. The first is bounded, the second is not.

**The thing to watch after launch** is `redeemed_email` against `email`. It is
the only one of these decisions taken on a guess about behaviour rather than a
property of the system, and it is instrumented precisely so it does not have to
stay a guess.

---

## Related files

- [how-a-reformer-works-course-plan.md](how-a-reformer-works-course-plan.md) - the course product: schema, admin authoring, portal, quiz, certificate. Everything this plan marks as shipped
- [reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md) - content, pricing, and positioning
- [course-launch-lifecycle.md](course-launch-lifecycle.md) - the manual launch checklist for live workshops
- [funnel-strategy-nikki-session.md](marketing/funnel-strategy-nikki-session.md) - the original tripwire brief
