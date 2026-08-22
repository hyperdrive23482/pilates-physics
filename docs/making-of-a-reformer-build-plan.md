# The Making of a Reformer: Build Plan

The technical plan for shipping the tripwire course and its four-day
subscriber offer. Companion to
[reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md),
which owns the content, pricing, and positioning decisions. This file owns
the mechanism.

This resolves the spec's open decision "Discount enforcement mechanism:
**Deferred.**"

## Decisions locked

| Item | Decision | Why |
|------|----------|-----|
| Discount mechanism | A second Stripe Price at $39, no coupon | Adaptive Pricing is on, which rules out amount-off coupons |
| Deadline shape | End of day, fixed timezone, not tag time plus N hours | A ragged expiry contradicts "today," "tomorrow," and "midnight" in the copy. See "Timeline" |
| Kit structure | Two sequences: 1 to 3 nurture, 4 to 8 cart | The tag cannot fire at entry, and the cart cannot skip weekends. See "Timeline" |
| Offer identity | Opaque token in a Kit custom field | Survives cross-device; no PII in URLs |
| Clock start | When the Kit tag is applied, not on click | Deadline is printable in the email and immune to link prefetch |
| Sync method | Vercel cron poll, every 15 minutes | Reuses existing cron infrastructure; easier to debug than a webhook |
| Tag trigger | Kit sequences and automations, internally | The cron is a pure reader and never writes tags |
| Launch cohort | Backfill everyone who got the spring calculator | See "The backfill" below |

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

## Page map

| Route | Audience | Price shown | Indexed |
|-------|----------|-------------|---------|
| `/education` | Public | none, a card only | yes |
| `/making-of-a-reformer` | Public | $69 | yes |
| `/offer/reformer?t=TOKEN` | Email only | $39 + countdown | **noindex** |
| `/portal/making-of-a-reformer` | Buyers | none | no |

The offer page must carry `noindex`. The spec's framing rule is that the public
page shows $69 only. If Google surfaces a $39 page, $69 stops reading as real
to anyone who browses.

### Three pricing blocks, not two

The visitor sees three different sales pages. Two of them show $69, and they
are **not the same page**.

| Page | Price | Says about the discount |
|------|-------|-------------------------|
| `/making-of-a-reformer` | $69 | Nothing. Ever. |
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

## Phase 0: Data model

- [ ] **Migration `042_making_of_a_reformer.sql`**

Add `'course'` to the `webinars_kind_check` constraint, which is currently
`webinar | tool | resource` per migration 034. Then seed the course row:

```sql
insert into public.webinars (slug, title, subtitle, status, kind, price_cents, kit_tag)
values ('making-of-a-reformer', 'The Making of a Reformer',
        'How your machine works and why', 'live', 'course', 6900, 'course-reformer');
```

Use `status = 'live'`. It is already in the check constraint, it already passes
the purchasability gate in `api/checkout/create-session.js`, and `kind =
'course'` keeps the row out of the workshop listings, which filter on
`kind === 'webinar'`. No new status value and no downstream changes.

- [ ] **Migration `043_subscriber_offers.sql`**

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
  kit_synced_at timestamptz,
  created_at timestamptz default now(),
  unique (offer_key, email)
);
create index on public.subscriber_offers (expires_at) where redeemed_at is null;
create index on public.subscriber_offers (kit_synced_at) where kit_synced_at is null;
```

Service-role RLS only. The offer page reads through an API route and never
queries this table from the browser.

Keep `offer_key` distinct per campaign, for example `reformer-backfill-2026-08`
against `reformer-nurture`. The `unique (offer_key, email)` constraint then does
the right thing: nobody gets two offers inside one campaign, but a future
re-run is not silently blocked by a row from a year ago.

---

## Phase 1: Sales page and pricing blocks

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

`/making-of-a-reformer` renders `CourseSalesBody` with `PublicPricing`.
`/offer/reformer` renders the same body and picks Active or Expired from what
`/api/offer` returned. Three pages to the visitor, one sales page to maintain.

- [ ] `src/components/course/CourseSalesBody.jsx`

Build it bespoke, in the shape of `PilatesPhysics101.jsx`, rather than through
the generic `WorkshopSalesPage`. The eight-module outline and the design-story
framing need real layout.

- [ ] `src/components/course/PricingBlock.jsx` with the three variants

- [ ] `src/pages/MakingOfAReformer.jsx`, routed at `/making-of-a-reformer`.
      Buy button posts to the existing checkout with no `offerToken`, and
      `allow_promotion_codes: true` stays on for this path.

- [ ] Add a card to the `PATHS` array in `src/pages/Education.jsx`

It slots between the spring calculator and PP101, which is the ladder the spec
describes. Card meta reads `$69` and `1 CEC`, once CEC is confirmed.

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
> calculator, the inspection checklist, and the CEC are all still included,
> exactly as they were.

**Public.** No mention of any of the above.

---

## Phase 2: The offer machinery

### 2a. Stripe setup, one time

- [ ] Create a second Price on the course product at $39. This is the same
      Price the PP101 order bump will use. Store the id as
      `TRIPWIRE_OFFER_PRICE_ID`.

### 2b. Kit setup, manual, in the dashboard

- [ ] Custom fields: `offer_token`, `offer_deadline`
- [ ] Tag: `tripwire-offer-open`
- [ ] The tag goes on the **last step of sequence 1**, so the first email that
      needs the merge fields (email 4, the cart open) is a full day later. See
      "Timeline" below for why this cannot be a single sequence

Fifteen minutes would cover the cron interval, and an hour would be cheap
insurance. Splitting the sequence buys a full overnight instead, for free.

### 2c. `api/cron/mint-offers.js`

- [ ] Add to the `crons` array in `vercel.json` alongside `publish-scheduled`
- [ ] Reuse the `CRON_SECRET` bearer check from `publish-scheduled.js` verbatim

Each run:

```
1. GET Kit subscribers tagged `tripwire-offer-open`, since cursor
2. filter out: existing subscriber_offers rows for this offer_key
               users already holding a course entitlement
3. insert up to 100 offer rows,
   expires_at = end_of_day(mint_date + 4 days) in America/Los_Angeles
   **Not now() + 72h. See "Timeline" below: a ragged afternoon deadline
   contradicts "today," "tomorrow," and "midnight" in the copy.**
4. PUT offer_token + offer_deadline back to Kit, throttled
5. stamp kit_synced_at; advance cursor only past fully-synced records
```

Step 5's ordering matters. Advance the cursor on sync, not on insert, or a
mid-batch failure orphans rows holding a token nobody ever received.

The 100-row cap is not optional. Vercel caps function duration and a few
thousand Kit field writes will not finish in one invocation. Kit rate-limits
the v4 API, so add a delay between writes and verify the current ceiling in
their docs before settling on a batch size.

- [ ] New function in `api/_lib/kit.js`: `updateSubscriberFields(subscriberId,
      fields)`. Follow the existing tag-cache pattern in that file.

### 2d. `api/offer.js` and `src/pages/OfferPage.jsx`

`GET /api/offer?t=TOKEN` returns one of four states:

| State | Condition | Page renders |
|-------|-----------|--------------|
| `active` | now < expires_at | `CourseSalesBody` + `ActivePricing` |
| `expired` | now > expires_at | `CourseSalesBody` + `ExpiredPricing` |
| `redeemed` | redeemed_at set | Link to the portal, no sales body |
| `unknown` | bad or missing token | Email-entry form, looks up by email |

**Keep this on one route, not two.** The state comes from server data, not from
the URL. If the URL carries it, someone bookmarks the active URL, hits it on
Saturday, and the redirect logic has to exist anyway. One route, four states,
server decides.

The `unknown` state matters more than it looks. Forwarded emails and clients
that strip query strings both land there, and it recovers those people instead
of dead-ending them.

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

## Phase 3: Checkout

Two changes to `api/checkout/create-session.js`.

- [ ] **Accept an optional `offerToken`.** Re-validate it server-side. Never
      trust that the page said it was valid. Then branch on price:

```js
const priceId = offer
  ? process.env.TRIPWIRE_OFFER_PRICE_ID
  : product.stripe_price_id
```

Set `allow_promotion_codes: false` on the offer path, so no other active
promotion code can stack on top of $39.

- [ ] **Add `offer_id` to session metadata** so the webhook can close the loop.

- [ ] **Comment the status gate.** Line 38 rejects anything not
      `upcoming | live`. The course passes as `live`, but without a comment the
      next person "fixes" it.

- [ ] **Webhook:** in `api/stripe/webhook.js`, inside the existing
      `provisionPurchase` path, set `redeemed_at` when `metadata.offer_id` is
      present. Everything else already works unchanged, because the course is
      just another `webinars` row: account creation, entitlement grant, and Kit
      tagging via `kit_tag`.

- [ ] **Write a test for the expiry check.** It is the only thing standing
      between an expired token and a $30 discount.

---

## Phase 4: Customer portal

The cheapest phase, because the foundations exist.

- [ ] **Dashboard:** `src/pages/PortalDashboard.jsx` already groups
      entitlements by `kind`. Add
      `const courses = workshops.filter((w) => w.kind === 'course')` and one
      section above Tools. Roughly six lines.

- [ ] **Course page:** `src/pages/WorkshopPortal.jsx` branches on
      `isInteractive` for tools and resources. Courses need a third branch.
      They are neither workshop chrome (dates, Zoom links, recordings) nor a
      single embedded tool. They need a module list with progress.

- [ ] **Content:** no new tables. `webinar_content` already supports
      `recording | download | bonus | slide_deck | resource | link` with
      `sort_order`, which covers the eight module videos, the PDF worksheet,
      and the inspection checklist. Seed them as rows.

- [ ] **Migration `044_course_progress.sql`**, the one genuinely new table:

```sql
create table public.course_progress (
  user_id uuid references auth.users(id) on delete cascade,
  content_id uuid references public.webinar_content(id) on delete cascade,
  completed_at timestamptz default now(),
  primary key (user_id, content_id)
);
```

Needed for the CEC completion requirement, not just for polish. No certificate
without it.

---

## Phase 5: Content shell

Ship the machinery against placeholder modules, then fill in. Videos are the
long pole and should not block the offer plumbing.

The spec's interactive tool list (parts diagram, adjustment simulator, load
curve animation) is its own project. Modules 1, 3, and 4 can launch as text
plus existing animations and be upgraded later, since the spec is explicit that
content never changes as an urgency lever.

---

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

### Split into two Kit sequences

This falls out of the tag timing and it solves three problems at once.

**Sequence 1, emails 1 to 3.** Nurture, no offer, no link that needs a token.
Weekday-only is fine here. The last step applies `tripwire-offer-open`.

**Sequence 2, emails 4 to 8.** Cart. **All seven days enabled, no exclusions.**

Why it has to be this way:

- **The tag cannot fire at sequence entry.** The clock starts when the tag is
  applied, and emails 1 through 3 run for the better part of a week before the
  cart opens. Tag on entry and the window expires days before email 4 ever
  mentions it.
- **Phase 2b's "at least 1 hour after the tag step" becomes a full day,** which
  is far more comfortable than an hour. The cron polls every 15 minutes and has
  overnight to mint the token and write `offer_token` and `offer_deadline` back
  to Kit before email 4 needs them.
- **Weekend exclusions are fatal once the cart is open.** The deadline is
  wall-clock and does not pause for Saturday. Exclude weekends in sequence 2 and
  a subscriber whose email 6 gets pushed to Monday has a window that expired
  Sunday with no reminder sent. Sequence 1 can skip weekends safely because
  nothing there is on a clock.

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

### What to change, in order

- [x] ~~Decide the window length.~~ **Four calendar days, 2026-08-21**
- [x] ~~Email 4 copy: "3 days" becomes "4 days"~~ **Done**
- [x] ~~Spec offer terms and the sequence cadence table~~ **Done**
- [ ] Cron: `expires_at = end_of_day(mint_date + 4 days)` in
      `America/Los_Angeles`, replacing `now() + 72h`
- [ ] Email 8 body: deadline from `{{ offer_deadline }}`, timezone named
- [x] ~~Phase 1 active pricing block: replace the "4:12pm" example with an
      end-of-day deadline~~ **Done**
- [ ] Kit: two sequences, tag on the last step of sequence 1
- [ ] Kit: sequence schedule 9am, all delays in days
- [ ] Kit: sequence 2 enabled all seven days
- [ ] Kit: email 8 as an 11-hour delay off email 7
- [ ] Test: one subscriber added at 11pm, confirm email 1 lands next morning
- [ ] Test: an expired token against `create-session.js`, already listed in
      Phase 3 and still the only thing between an expired link and a $30 discount

### How this interacts with the backfill

It does not, much, which is the point of a rolling per-subscriber deadline. Each
wave mints its own end-of-day deadline four days out from its own tag event, so
staggering a few hundred a day produces a steady trickle of windows rather than
one spike. The cron sees the same steady input either way.

One thing to watch: the backfill cohort enters at the **sequence 1** step, so
their window does not open until they clear emails 1 through 3. Budget for that
when planning waves. A wave tagged Monday does not reach cart open until the
following week.

---

## The backfill

Tagging the whole spring-calculator list turns a trickle into a batch job.

**Exclude existing buyers.** Filter against `user_entitlements` before minting.
Sending a discount for something someone already owns is the kind of error
people screenshot.

**Stagger it in Kit, do not dump it.** Two reasons:

- *Deliverability.* This list opted in for a free calculator and has never
  received a sales email. Two thousand promotional sends in one hour is the
  shape spam filters look for.
- *The deadline spike.* One tag event means one shared deadline, so every
  reminder email and every purchase lands in the same four days, then silence.

Tag in waves, a few hundred a day over a week or two. The cron does not care.
It sees a steady trickle, which is what it was designed for. This is a Kit
scheduling decision, not code.

**The copy conflict.** The spec's framing rule is:

> Tie the discount to the subscriber being new, not the product being new:
> "you just joined the list, so you have three days at $39."

That is true for every future subscriber and false for the entire backfill
cohort. Some of them ran the calculator months ago, and this is the first sales
email they have ever received. "You just joined the list" reads as a mail merge
that did not check.

The backfill cohort needs its own email 1, anchored to what they did rather
than when they joined: they ran the calculator, they got one spring's number,
here is the rest of the machine. Emails 2 through 4 can be shared unchanged,
since those are about the product rather than the timing.

Practically: two Kit sequences sharing one tag, or one sequence with email 1
swapped by segment.

---

## Build order

1. Phase 0 migrations
2. Phase 4 portal, which proves the course renders before you sell it
3. Phase 1 sales page and the `/education` link
4. Phase 3 checkout branch
5. Phase 2 offer machinery
6. Phase 5 content

Offer machinery comes late deliberately. Until the course exists in the portal
and sells at $69, there is nothing to discount and the cron has no reason to
run.

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
| Graded quiz, 10 questions, CEC | Nothing. Surveys collect, they do not score | **Real build.** Scoring, pass threshold, retakes, attempt storage. Ties to `course_progress` and the certificate |
| PDF worksheet and inspection checklist | `api/_lib/build-certificate.js`, pdfkit already a dependency | Medium. Design work more than code |
| Downloads | `webinar_content` type `download`, admin storage (migration 005) | Near zero. Seed rows |
| Certificate | `api/certificate/[workshopId].js` exists with NPCP fields (migration 024) | Small, gated on the quiz existing |

Everything except the quiz is a config change or a seed row. The quiz is the
only genuinely new admin surface, and it is blocked on the spec's open item:
write the ten questions once CEC requirements are known.

---

## Related files

- [reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md) - content, pricing, and positioning
- [course-launch-lifecycle.md](course-launch-lifecycle.md) - the manual launch checklist for live workshops
- [funnel-strategy-nikki-session.md](marketing/funnel-strategy-nikki-session.md) - the original tripwire brief
