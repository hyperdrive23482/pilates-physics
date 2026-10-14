# Admin Analytics Engine Plan

Analytics, Funnel and SEO pages for the Pilates Physics admin portal, modeled on the remo super-admin pages (`pilates-session-coach`: `/superadmin/analytics`, `/superadmin/funnel`, `/superadmin/seo`) and adapted to how Pilates Physics actually sells.

**Date:** 2026-10-14
**Status:** Phases 0 and 1 and SEO foundations 3a are on `dev` (403a5e3) with migrations 061 to 064 applied to the dev database and stage.pilatesphysics.com serving the sitemap and robots.txt; the prod deploy, the Vercel PostHog server vars, the Stripe webhook events, the Kit custom fields and Search Console are still manual (Appendices B, C and D). Phase 2 (the Funnel page) built 2026-10-14 in the same checkout, uncommitted; see Appendix D. Phase 3b not started.
**Reference:** remo pages live at `src/pages/admin/{Analytics,FunnelOverview,SeoDashboard}.tsx`, with plan docs `docs/plans/funnel-overview.md` and `docs/plans/seo-dashboard.md` in that repo.

---

## 1. What we are starting from

A survey of the dev branch on 2026-10-14 found:

| Area | State today |
|---|---|
| Visitor analytics | None. No PostHog, GA, Plausible or pixel. Anonymous visits are not recorded anywhere. |
| Attribution | None. No UTM, referrer or landing-page capture. Stripe metadata holds only product, user and pricing tier. |
| Event log | `activity_events` (migration 042). Server-written, signed-in users plus `checkout_start`, `purchase`, `lead_magnet_claim`. Good chargeback evidence, thin product analytics. |
| Revenue | Parsed in JS from `stripe_events.payload.amount_total` inside `api/admin/analytics-summary.js`. Assumes USD cents. No refunds or disputes handled. No orders table. |
| Email | Kit v4 API read live in `api/admin/kit/metrics.js` with a 10 minute in-memory cache. Already has per-sequence funnels, tag counts, $39 offer stats. No history is kept, so Kit's 30 day growth window is all we ever see. |
| Admin UI | `AdminAnalytics.jsx` renders totals, an engagement block and a per-workshop table from one endpoint. `StatCard` is the only shared widget. No charting or date library installed. |
| SEO | Nothing. Pure Vite SPA with one global `<title>`. No sitemap, robots.txt, per-page meta, canonical, JSON-LD or prerendering. Search Console is not connected. |
| Known gaps in existing code | `auth.admin.listUsers` capped at 1000; `ACTIVITY_CAP` 50k rows read into memory; Adaptive Pricing foreign currency counted at face value. |

Everything in this plan builds on `requireAdmin` (`api/_lib/require-admin.js`), `useAdminAPI`, the `is_admin()` SQL function, and Vercel crons in `vercel.json`. Pilates Physics has no Deno edge functions, no pg_cron and no Vault, so remo's delivery layer is replaced with Vercel API routes and Vercel crons throughout.

---

## 2. What remo teaches, and what not to copy

### Patterns to port

| remo pattern | Why it fits | Where it lands here |
|---|---|---|
| One shared `DateRange` (`7d, 30d, 90d, 12m, all`) with period bucketing (`getBuckets`, `fillFlow`, `fillStock`) in `components/admin/analytics/shared.ts` | Every page reads the same way; "current period vs prior periods" bars are the right shape for a business with a few launches a year | `src/components/admin/analytics/shared.js` |
| `KpiCard` (clickable, selects the chart metric) + `MetricChart` (period bars, highlighted current bar; area for snapshot series) | Compact, one chart per tab, no dashboard sprawl | same folder |
| `FunnelStep` collapsible cards with "n of m · p%" rates and no bars | Honest about small numbers | `src/components/admin/funnel/` |
| Period funnel, not cohort, with standalone steps that are never divided by the step above | Matches sparse, launch-driven data | Funnel page |
| First-party first/last touch attribution captured in localStorage before React mounts, written once server-side with redaction | Cheap, cookie-free, survives ad blockers, no vendor | `src/lib/attribution.js`, new `touch_attribution` table |
| Daily snapshot table filled by a cron, so history accrues forward | Kit only exposes 30 days of growth; Stripe list passes are slow | `daily_snapshots` + `api/cron/daily-snapshot.js` |
| SEO engine split into import-free pure modules (`seo-rules`, `seo-crawl`, `gsc`) that run in a function, a dry-run script and a unit test | Directly portable to Node; the rules were tuned on an SPA with the same shell problem we have | `api/_lib/seo/*.js` |
| Service account auth for Search Console (not OAuth; testing-status refresh tokens die after 7 days) | Same constraint applies | `GSC_SERVICE_ACCOUNT_JSON` secret |
| Recommendations = deterministic findings ranked by `severity × pages × (1 + 30d visitors)`, with an LLM narrative on a button, never a cron | Keeps cost explicit (about $0.18 per run) | SEO page |
| Each half of a page fails independently and renders "—" with the reason | Kit, PostHog and Google will each go down on their own schedule | all three pages |
| Payload echo check (`answersPlan`) and optional fields so a page newer than its deployed function degrades instead of lying | Vercel deploys are atomic here, so lower risk, but keep optional fields | API responses |

### Patterns to skip

- **MRR, trials, churn, billing retention, cohort trial-to-paid.** Pilates Physics sells one-time products. The equivalents are repeat purchase rate, time from lead to first purchase, and ascension from the $39 offer to a core workshop.
- **Margins tab.** API costs are negligible; Stripe fees are the only cost worth showing, and they belong in the Revenue tab.
- **Definer-style SQL views read from the browser via PostgREST.** Pilates Physics admin pages already go through `/api/admin/*` with the service role. Keep that. SQL views are still useful, but the API route reads them.
- **Deno edge functions, pg_cron, Vault.** Vercel API routes and `vercel.json` crons instead.
- **Creator/Pro plan split.** No equivalent. The product filter (workshop vs course vs offer) replaces it.
- **Full Stripe list passes on every page load** (20 seconds in remo). We already have every checkout session in `stripe_events.payload`. Normalize it once into a `purchases` table and never page Stripe from a page load again.

---

## 3. Target architecture

```
Browser (admin, JWT with is_admin)
  /admin/analytics   tabs: Revenue · Products · Learners · Audience · Engagement
  /admin/funnel      6-step period funnel + drill-downs + sources
  /admin/seo         tabs: Audit · Recommendations · Pages · Search
  /admin/kit         (exists) email engine detail; Funnel links into it
        │  useAdminAPI → fetch('/api/admin/...', Bearer JWT)
        ▼
Vercel API routes (requireAdmin, service role)
  api/admin/analytics/{revenue,products,learners,audience,engagement}.js
  api/admin/funnel.js
  api/admin/seo.js                 action switch, proxies long jobs to workers
  api/cron/daily-snapshot.js       06:00 UTC
  api/cron/seo-search-sync.js      06:30 UTC daily
  api/cron/seo-audit.js            Mon 09:00 UTC
  api/cron/seo-index-inspect.js    Mon 09:30 UTC
  api/sitemap.xml.js               generated from routes + blog_posts
        │
        ▼
Supabase (service role from API only)
  purchases, touch_attribution, daily_snapshots,
  seo_audit_runs, seo_audit_findings, seo_finding_dismissals,
  seo_search_daily, seo_index_status
  views: admin_revenue_daily, admin_learner_progress, admin_product_summary
        │
External (server-side only)
  PostHog HogQL (visitors, channels, pre-lead journeys)
  Kit v4 (list, tags, sequences; already wrapped in api/_lib/kit.js)
  Stripe (webhook only; refunds and disputes added)
  Google Search Console + PageSpeed Insights
  Anthropic (SEO narrative, on demand)
```

Shared client code: `src/components/admin/analytics/{shared.js,KpiCard.jsx,MetricChart.jsx,AdoptionMetric.jsx,BreakdownTable.jsx}`, `src/components/admin/funnel/FunnelStep.jsx`. Install `recharts` (the only new client dependency). Keep date math in plain `Date`, as remo does, since there is no date library and the bucketing helpers do not need one.

---

## 4. Phase 0: Foundations (prerequisite for all three pages)

Nothing visible to Kaleen ships in this phase, but every later number depends on it. Target: one dev deploy, about a week of calendar time to let data accrue.

### 4.1 Decide and install visitor analytics

**Decided 2026-10-14: PostHog, same as remo, with `persistence: 'localStorage'` so no cookie is set, and session replay off.**

Why not first-party pageview logging into Postgres: we would have to build sessions, channel classification, referrer parsing, geo, bounce and time-on-page ourselves, and remo's HogQL queries (visitors by content path, entries by channel, pre-signup journey) are ready to port. Why localStorage persistence: the activity logging plan took a no-consent-banner, legitimate-interest position on the grounds that we set no cookies. localStorage keeps that position intact while preserving a stable anonymous id per browser, which the pre-lead journey needs. Session replay stays off.

Setup, mirroring `pilates-session-coach/src/lib/posthog.ts` and `posthog-setup-report.md`:

- `posthog-js` by dynamic import in `src/main.jsx`, `defaults: '2026-05-30'` so React Router navigations are captured as `$pageview`, `person_profiles: 'identified_only'`, `persistence: 'localStorage'`, `disable_session_recording: true`, `capture_exceptions: false`.
- Vercel rewrite `/ingest/*` → PostHog US host, as remo does, so ad blockers do not eat events.
- Identify by Supabase user id on sign-in; opt admins out so Kaleen's own browsing never counts.
- One project. Filter prod by `$host` in every HogQL query (remo's `POSTHOG_PROD_HOST`), because dev previews will share it.
- Define `CONTENT_PATHS` once in `api/_lib/posthog.js` and keep it in step with the public routes list in `src/App.jsx` and the sitemap generator. remo's documented pain: retired paths must stay in the list or history disappears.
- Custom events worth capturing beyond pageviews: `calculator_used` (anonymous calculator interaction before claiming), `checkout_started` (client side, with product slug), `lead_claimed`. The server already logs the authoritative versions; these exist to join the anonymous journey to the outcome.

Env: `POSTHOG_API_KEY` (Query: Read), `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, `POSTHOG_PROD_HOST`, client `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST=/ingest`.

Fallback if PostHog is rejected: a `page_views` table written by a `page_view` event type on `api/portal/activity.js` with no auth required, path and referrer host only, deduped per anonymous id per path per hour. The Funnel step 1 and SEO Pages tab then lose channel, geo and bounce columns. The plan below marks what degrades.

### 4.2 First-party attribution

Port `pilates-session-coach/src/lib/attribution.ts` to `src/lib/attribution.js`, run from `src/main.jsx` before React:

- `pp.attr.first`: first ever page load, never overwritten. `pp.attr.last`: most recent load that came from somewhere (external referrer host, any UTM, or a `/r/<code>` path if referrals ever exist).
- Stored: referrer host only, landing pathname only with tokens redacted (offer tokens in `/offer/*` must be stripped), five UTM params, timestamp.

Persist it at the two moments a person becomes known to us:

| Moment | Where | How |
|---|---|---|
| Lead claim | `api/springs101.js` | Client sends `attribution` in the POST body; server writes `touch_attribution` row for the created user |
| Checkout | `api/checkout/create-session.js` | Client sends `attribution`; server puts a compact form in Stripe `metadata.attr_*` and logs it on `checkout_start`; `provision-purchase.js` writes the `touch_attribution` row if none exists for that user |
| Kit form embeds (newsletter, waitlist) | `NewsletterForm.jsx`, `WaitlistForm.jsx` | These post straight to Kit and never touch us. Add hidden Kit custom fields `utm_source`, `utm_campaign`, `referrer`, `landing_path` populated from the stored first touch, so Kit carries the same attribution for people who never claim the calculator |

Table `touch_attribution`: `user_id` (unique, ON DELETE SET NULL), `email` snapshot, `first_*` and `last_*` columns (referrer_host, landing_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term, seen_at), `recorded_via` (`lead_claim | checkout | backfill`), `created_at`. Write-once. RLS: admin select only; API writes with service role.

Bucketing (`touchSource`, port of `_shared/attribution.ts`): referral link, then utm_source with aliases (ig → Instagram), then referrer host via regex map (Instagram, Google, ChatGPT, Substack, Kit, Pinterest, YouTube), else Direct. Lives in `api/_lib/attribution.js`, import-free, unit-tested, imported by both the API and the Funnel sources panel.

### 4.3 Normalize purchases

New table `purchases`, one row per paid Checkout Session, written by `api/stripe/webhook.js` and backfilled from `stripe_events.payload` in the migration:

`id`, `stripe_session_id` (unique), `stripe_payment_intent_id`, `stripe_charge_id`, `user_id`, `email`, `webinar_id`, `webinar_slug`, `pricing` (`full | early_bird | offer | scholarship | bundle`), `presentment_currency`, `presentment_amount_cents`, `settled_usd_cents` (from the charge's balance transaction; falls back to presentment when USD), `stripe_fee_cents`, `discount_cents`, `promotion_code`, `coupon_id`, `offer_key`, `scholarship_code_id`, `user_state` (`new | returning | logged_in`), `purchased_at`, `refunded_at`, `refund_usd_cents`, `disputed_at`, `dispute_status`.

Webhook changes:

- `checkout.session.completed`: after `provisionPurchase`, insert `purchases`. Fetch the charge's `balance_transaction` for `settled_usd_cents` and `stripe_fee_cents`. This closes the Adaptive Pricing gap flagged in `analytics-summary.js`.
- `charge.refunded`: stamp `refunded_at`, `refund_usd_cents`. Do not revoke entitlements automatically; policy is all sales final and refunds are a manual decision.
- `charge.dispute.created` / `charge.dispute.closed`: stamp dispute columns. Revenue reports subtract lost disputes.

Backfill: migration script iterates `stripe_events` where `event_type = 'checkout.session.completed'` and `status in ('processed','kit_failed')`, inserts with `settled_usd_cents = presentment` and a `needs_settlement_lookup` flag; a one-off admin action fetches balance transactions for flagged rows (one Stripe call each, a few dozen rows).

View `admin_revenue_daily`: per day, per `webinar_id`, per `pricing`: orders, gross, discounts, fees, refunds, net. Views are read only by API routes, so they can be plain `security_invoker = on` views with no gate inside them.

### 4.4 Daily snapshot cron

`daily_snapshots` (`snapshot_date` primary key, jsonb `kit`, `users`, `revenue`, `tags`): one row per UTC day written by `api/cron/daily-snapshot.js` at 06:00 UTC.

Captured: Kit total active subscribers, 24h new and cancelled (from `growth_stats`), active count per funnel tag (`spring-calc`, `in-HARW-sequence`, `HARW-purchased`, `HARW-didnotbuy`, each product `kit_tag`), `auth.users` count, cumulative net revenue, entitlements count by source, `subscriber_offers` live count. Cheap, idempotent upsert, about 10 Kit calls. Charts over 30 days become possible once it has run for 30 days, so this ships first.

Refactor `api/admin/kit/metrics.js`'s `buildMetrics` into `api/_lib/kit-metrics.js` so the cron, the Kit page and the Funnel page compute the Kit funnel one way.

### 4.5 Shared UI kit and route scaffolding

- `npm i recharts`.
- Port `shared.ts` (types dropped, JSDoc kept), `KpiCard`, `MetricChart`, `AdoptionMetric`, `FunnelStep` + `BreakdownTable` + `Snapshot` to JSX. Styling follows `docs/design-system.md` and the existing admin Tailwind classes, not shadcn.
- Routes `/admin/funnel` and `/admin/seo` added in `src/App.jsx` under `AdminGate`; `AdminNav.jsx` gains Funnel and SEO next to Analytics.
- `useAdminAPI` gains an `abort` on unmount and a tiny range-keyed cache (remo's `range|plan` cache) so switching tabs does not refetch.
- Fix the two existing caps while touching `analytics-summary.js`: page `listUsers` fully, and move the engagement tallies to a SQL view (`admin_engagement_daily` grouped by `event_type`, `webinar_id`, `tool_slug`, `content_id`, `date_trunc('day')`) so the 50k row read goes away.

---

## 5. Phase 1: Analytics page

Replace `AdminAnalytics.jsx` with a tabbed page (`?tab=`), one `DateRange` select in the header, default `30d`. Each tab is its own API route so a slow or failing source only costs one tab.

### Revenue (`api/admin/analytics/revenue.js`, from `purchases` + `admin_revenue_daily`)

- KPIs (clickable, drive the chart): Net revenue in range, Orders, Average order value, Repeat buyer share, Refunds and disputes.
- MetricChart: period bars for the selected KPI; "all time" shows per calendar month.
- By product table: orders, gross, discounts, net, share of range revenue, per workshop or course.
- By pricing tier table: full, early bird, $39 offer, scholarship. This is the question Kaleen actually asks after a launch: how much came through the early bird window versus full price.
- Launch view: a launch picker (each `webinars` row with `scheduled_at`) that shows daily orders from cart open to cart close with early bird end as a reference line. Period funnels hide launch shape; this is where it lives.
- Stripe fees line, and a footnote stating settled USD vs presentment for Adaptive Pricing orders.

### Products (`api/admin/analytics/products.js`)

One row per workshop or course: paid enrollments, granted enrollments by source (manual, kit_tag, bonus, scholarship, lead_magnet), revenue, portal view rate (buyers who opened the portal at least once), recording watch rate, certificate downloads, NPS and response count from `workshop_feedback`, unanswered questions. Expanding a row shows the `webinar_content` items ranked by distinct openers (today's engagement block, scoped to one product).

### Learners (`api/admin/analytics/learners.js`, courses only)

The How a Reformer Works course is the first product with a measurable learning path, and CECs make completion a compliance question, not just an engagement one.

- Per course: a module completion funnel (started → each module → quiz attempted → quiz passed → certificate downloaded), from `course_progress`, `quiz_attempts`, `activity_events`.
- Median days from purchase to first module, purchase to completion.
- Quiz: attempts per passer, first-attempt pass rate, per-question miss rate (from `quiz_attempts.answers` against `quiz_questions`). A question most people miss is either a teaching gap or a bad question, and both matter.
- Stalled learners: bought more than 14 days ago, under 50% complete. Exportable list for a nudge email.

### Audience (`api/admin/analytics/audience.js`, from `daily_snapshots`, Kit, `auth.users`, `touch_attribution`)

- KPIs: Kit active subscribers (snapshot area chart once history exists), New accounts in range by source (lead magnet, purchase, manual), Leads who became buyers (all time, with median days), Buyers who were never leads.
- Where new accounts came from: BreakdownTable by first touch and last touch (from `touch_attribution`), with "No record" shown honestly for pre-launch accounts.
- Geography: country and US state from PostHog `$geoip_*` on content paths (degrades to nothing without PostHog).
- Recent accounts table: joined, source, first touch, products owned, last sign in; row expands to the user activity timeline that `UserActivityPanel` already renders.

### Engagement (`api/admin/analytics/engagement.js`, from `admin_engagement_daily`)

Today's engagement block, kept and made range-aware: active users, logins, portal views, tool opens ranked by distinct users, content opens ranked by distinct users, sessions by weekday, buyers who have never signed in (with the existing 30/60/90 day split). Day-of-week and hour-of-day bars for logins are cheap and tell Kaleen when to send email.

Remove the Kit panels from this page. Audience links to `/admin/kit` for sequence detail.

---

## 6. Phase 2: Funnel page

`/admin/funnel`, `api/admin/funnel.js` returning `{traffic, leads, nurture, offer, core, repeat, sources, errors}` with each block independently nullable. Controls: `DateRange`, and a product filter for steps 5 and 6 (All, PP101, PP102, HARW course). Period funnel: each step counts events inside the window.

### Steps

| # | Step | Headline count | Source | Rate shown |
|---|---|---|---|---|
| 1 | Web traffic | Unique visitors on content paths | PostHog `uniq(person_id)`, `$host` = prod, `CONTENT_EVENT` | none |
| 2 | Leads | Calculator claims + Kit form subscribers | `activity_events.lead_magnet_claim` (or entitlements `source='lead_magnet'`) plus Kit subscribers created in range who were not claims (by email) | % of step 1 |
| 3 | Entered offer window | People tagged `in-HARW-sequence` or rows minted in `subscriber_offers` in range | `subscriber_offers.created_at`, Kit tag `tagged_at` | % of step 2 |
| 4 | Tripwire bought | `purchases` with `pricing='offer'` | `purchases` | standalone: "n of m offers that expired in this window", from `subscriber_offers.expires_at` |
| 5 | Core workshop bought | `purchases` for workshop kind products at full or early bird | `purchases` | standalone; note "x of these were leads first, median d days from lead" |
| 6 | Bought again | Buyers whose second-or-later purchase falls in range | `purchases` | "of N buyers who had bought before this window" |

Steps 4 to 6 are standalone, as remo's steps 4 and 5 are, and the UI must never divide them by the step above. Port `FunnelOverview.test.tsx`'s assertion for this.

### Drill-downs

- **Traffic:** visits, pages per visit, Channel, Top referrers, Campaigns, Country, US state (PostHog session properties). Caveat line that the number is below PostHog Web Analytics because in-app and preview traffic are excluded.
- **Leads:** sources by first touch and last touch (`touch_attribution`), landing pages, "what they looked at before claiming" (PostHog pre-lead pageviews per person, median and mean pages, top pages), calculator interactions that never claimed (PostHog `calculator_used` minus claims).
- **Entered offer window:** nurture email open and click rates per email (from `kit-metrics.js`, already computed), unsubscribes during nurture, days from claim to offer mint.
- **Tripwire:** minted → seen → redeemed → forwarded, plus redemption by day of the 4 day window (the panel the HARW build plan tabled), and offer cohort view by mint week. Also "expired unused who later bought at full price".
- **Core workshop:** by product, by pricing tier, by prior status (was a lead, was a tripwire buyer, cold), days from first touch to purchase, by first touch source. Launch timeline link to the Revenue tab's launch view.
- **Bought again:** first product → second product matrix (which product leads to which), median days between purchases, share of all buyers who bought twice.
- **Sources (below the steps):** conversion tables by first touch, last touch and campaign: leads, tripwire buyers, core buyers, per source. User ids never leave the server; only counts do.

### Design notes

- Lead step 2 is the one place Kit and our database disagree. Kit sees everyone who filled a form; we only see calculator claims. Report both numbers and the overlap, not a sum.
- Because the activity log started 2026-08 and attribution starts at Phase 0 deploy, every panel shows "measured n of m" and "unseen" counts, as remo does.
- Cache clean responses client-side keyed by `range|product`; keep stale numbers dimmed while switching.

---

## 7. Phase 3: SEO page

This is the largest gap and has a hard prerequisite: there is no SEO surface to audit yet. Phase 3a fixes the site; 3b builds the dashboard.

### 3a. SEO foundations (ship before the dashboard, each is independently valuable)

1. **Sitemap and robots.** `api/sitemap.xml.js` builds from a `PUBLIC_ROUTES` list (shared with `CONTENT_PATHS`) plus published `blog_posts`, with `lastmod` from `updated_at`. `vercel.json` rewrites `/sitemap.xml` to it. Static `public/robots.txt` allowing all, disallowing `/portal`, `/admin`, `/offer`, `/auth`, and pointing at the sitemap. The existing `X-Robots-Tag: noindex` on `/offer/*` stays.
2. **Head component.** A small `<Head title description canonical image type>` component (react-helmet-async or a 40 line hook on `document.head`) used by every public page. Blog posts render title, description from `excerpt`, `og:image` from `featured_image_url`, and `canonical_url` when set (the 16 Substack mirrors should point at Substack, or we decide to claim them; see decisions).
3. **JSON-LD.** `BlogPosting` on posts (headline, datePublished, dateModified, author Kaleen Canevari, mainEntityOfPage, image), `Course` on course pages, `Event` on dated workshops, `Organization` on the home page.
4. **Prerendering decision.** remo's own audit flags every SPA shell page as `prerender.shell`, an error, and Google indexes shells poorly. Options:
   - **Head injection at the edge (recommended).** A Vercel function at `api/_render/page.js` serves `dist/index.html` with the route's `<title>`, meta, canonical, JSON-LD and, for blog posts, the `body_html` injected into `#root` as static HTML that React hydrates over. `vercel.json` routes `/`, `/blog/:slug`, and the product landing pages to it; everything else stays an SPA rewrite. No user agent sniffing, so no cloaking. Roughly two days of work.
   - Build-time static generation of blog posts (react-snap style). Brittle with a Supabase-backed CMS; every publish needs a redeploy.
   - Full SSR framework migration. Out of scope.
5. **Images.** Alt text field on `blog_posts` featured images exists (`featured_image_alt`); the Head component uses it. Audit will flag inline images missing alt.

### 3b. Dashboard

Tables (migration): `seo_audit_runs` (`status`, `trigger`, `started_at`, `finished_at`, counts, `site` jsonb, `pages` jsonb snapshot, `psi` jsonb, `narrative` jsonb, `narrative_cost_usd`), `seo_audit_findings` (`run_id`, `rule_id`, `severity`, `path`, `detail`, `fix`, `evidence` jsonb, `mode` in `raw | psi | gsc`), `seo_finding_dismissals` (`rule_id`, `path`, `reason`, `dismissed_by`), `seo_search_daily` (`date`, `page`, `query`, `clicks`, `impressions`, `position`; `query=''` for page totals), `seo_index_status` (`path`, `verdict`, `google_canonical`, `last_crawl`, `raw`). RLS on, no policies; API reads with service role.

Engine, ported from remo's import-free modules into `api/_lib/seo/`:

- `crawl.js`: robots + sitemap fetch, breadth-first crawl at concurrency 4, 10 s timeout, manual redirects, 60 page cap, `EXTRA_PATHS` for `/links` and `/login`. Our site has about 25 public routes plus about 20 posts, so a full crawl fits comfortably in a 60 s Vercel function (remo's 18 pages took under a second).
- `rules.js`: every remo rule carries over unchanged (robots, sitemap, crawl status/redirect/slow/heavy, prerender shell, noindex expectations for `/offer/*`, head title and description lengths, canonical, duplicates, og tags, headings, img alt, internal links, JSON-LD validity, BlogPosting required fields). Add `course_fields` and `event_fields` for the new schema types. `ROUTE_SOURCES` maps paths to `src/pages/*.jsx` so each finding names the file to edit.
- `gsc.js`: service account JWT (RS256 via Node `crypto`, not WebCrypto), `searchAnalytics` paged at 25k rows, `inspect`. `GSC_PROPERTY=sc-domain:pilatesphysics.com` (confirm the actual domain and that it is verified in Search Console; the service account email must be a Full user).
- `psi.js`: PageSpeed Insights, mobile strategy, 2 paths per invocation, 150 s is over Vercel's limit so run with `maxDuration: 300` on the Pro plan and keep to one path per call if it times out.
- `narrative.js`: the structured-output prompt and schema from `_shared/seo-narrative.ts`, with inputs trimmed to our size (open findings, titles and descriptions, 30 day visitors and leads per page, top 40 queries, index verdicts). Model `claude-opus-5-5` for quality on a button press; usage and cost stored on the run.

API `api/admin/seo.js` action switch: `overview`, `findings`, `pages {from,to}`, `search {from,to}`, `dismiss`, `undismiss`, `run-audit`, `run-psi {paths}`, `run-sync {backfill}`, `run-inspect`, `recommend`. Long jobs run inline when they fit, otherwise the action inserts a `running` run and the matching cron route does the work; the page polls `overview` every 3 s while a run is `running`, exactly as remo does.

Crons in `vercel.json`: `seo-search-sync` daily 06:30 UTC (3 day window, 1 day lag); `seo-audit` Monday 09:00 UTC; `seo-index-inspect` Monday 09:30 UTC. PSI never on a cron. All three check `CRON_SECRET` like the existing crons.

Tabs:

- **Audit:** last run, pages crawled, error/warn/info counts; Run audit, Check page speed (home and newest post), Check index status buttons; site-wide line (robots ok, sitemap count, orphans); per-page table (path, status, ms, title, canonical, PSI score, indexed, worst severity) with the expanded detail block from remo.
- **Recommendations:** findings grouped by rule, ranked by `severity × pages × (1 + 30d visitors)`, each with fix text and source files; Ignore with reason, Restore; Written recommendations card with summary, "do these first", title and description rewrites with character counts, content ideas with target query, caveats, cost footer.
- **Pages:** one row per content path: visitors, views, entries, organic entries, bounce, avg time (PostHog), leads whose first content page was this one (our `lead_magnet_claim` joined to PostHog persons), clicks, impressions, position (Search Console). This is the blog's report card and should replace the "which posts work" question Kaleen currently answers by feel.
- **Search:** Sync last 3 days, Backfill 16 months; Queries (top 500 by impressions), By page, Over time (impressions and clicks area chart with audit run dates as reference lines).

Without PostHog the Pages tab keeps only the Search Console columns and the lead column disappears.

---

## 8. Phasing, order and rough effort

| Phase | Contents | Effort | Ships when |
|---|---|---|---|
| 0a | PostHog install and proxy, attribution capture and `touch_attribution`, Kit hidden fields | 2 days | First, so data starts accruing |
| 0b | `purchases` table, webhook refunds and disputes, backfill, `admin_revenue_daily` | 2 days | With 0a |
| 0c | `daily_snapshots` cron, `kit-metrics.js` refactor | 1 day | With 0a |
| 0d | recharts, shared UI kit, routes, nav, `listUsers` and activity cap fixes | 2 days | With 0a |
| 1 | Analytics page, five tabs | 4 to 5 days | Two weeks after 0, so period comparisons have data |
| 3a | Sitemap, robots, Head, JSON-LD, head injection | 3 days | Can run in parallel with Phase 1; the earlier Google sees it the better |
| 2 | Funnel page | 4 days | After Phase 1 (reuses its API blocks) |
| 3b | SEO dashboard, engine port, GSC and PSI, crons, narrative | 5 to 6 days | After 3a has been live at least a week so Search Console has rows |

Total about five working weeks of build spread over roughly two calendar months, because the useful ordering is gated by data accrual rather than code.

Each phase gets its own dev deploy, a smoke test against the dev Supabase project, then a prod runbook via the `prod-deploy` skill. Migrations start at `061` on dev; the prod push order must respect the already pending migrations noted in memory (036, 040, 054, 056).

---

## 9. Decisions needed from Kaleen before Phase 0

1. **PostHog yes or no.** **Decided 2026-10-14: yes**, with localStorage persistence and no session replay. The first-party `page_views` fallback in section 4.1 is not being built.
2. **Prerendering approach** for 3a. Recommendation: head injection at the edge for `/`, `/blog/:slug` and the product landing pages.
3. **Substack mirrored posts.** Keep `canonical_url` pointing at Substack (Substack keeps the ranking, we stay a mirror) or drop it and claim them (we take over ranking, risk a duplicate content window). Recommendation: claim them if Substack is no longer actively published to; otherwise keep the canonical.
4. **Search Console access.** Confirm the property exists and is verified, and that Kaleen can add a service account as a Full user. Without this, the Search tab and index verdicts cannot exist.
5. **Refund semantics.** Confirm refunds and lost disputes should subtract from reported revenue without touching entitlements.
6. **Narrative model.** `claude-opus-5-5` (best quality, roughly $0.20 per run) or `claude-sonnet-5-5` (about a fifth of that).

---

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| PostHog query timeouts (remo hit them) | Inline id lists rather than subqueries, bounded time windows, best-effort blocks that render "—" |
| Content path list drifts from routes | One `PUBLIC_ROUTES` constant feeds the sitemap, `CONTENT_PATHS` and the SEO crawl seed; a unit test asserts every route in `App.jsx` is classified |
| Vercel function duration limits for crawl and PSI | 60 s default is enough for the crawl; PSI uses `maxDuration` and one path per call |
| Kit rate limit (120/min) during snapshot and funnel loads | Snapshot runs once a day; funnel reads Kit through the shared 10 minute cache; `kit-metrics.js` already reports per-section errors |
| History only accrues forward | Ship Phase 0 first and accept that period comparisons are empty for the first month; backfill `purchases` from `stripe_events`, which does carry full history |
| Service account key handling in PowerShell strips quotes (remo note) | Document setting `GSC_SERVICE_ACCOUNT_JSON` through the Vercel dashboard, not the CLI |
| Local vs UTC date boundaries | Compute ranges in UTC on the server and label the UI "UTC days", as the activity log already does |

---

## Appendix A: remo file map for porting

| Purpose | remo source (pilates-session-coach) | Target here |
|---|---|---|
| Range, bucketing, series helpers | `src/components/admin/analytics/shared.ts:611-880` | `src/components/admin/analytics/shared.js` |
| KPI card, metric chart | `src/components/admin/analytics/{KpiCard,MetricChart,AdoptionMetric}.tsx` | same names, `.jsx` |
| Funnel step and tables | `src/components/admin/funnel/{FunnelStep,shared}.ts(x)` | `src/components/admin/funnel/` |
| Attribution capture and bucketing | `src/lib/attribution.ts`, `supabase/functions/_shared/attribution.ts` | `src/lib/attribution.js`, `api/_lib/attribution.js` |
| PostHog HogQL client and content filter | `supabase/functions/_shared/posthog.ts` | `api/_lib/posthog.js` |
| Funnel traffic queries | `supabase/functions/admin-funnel-traffic/traffic.ts` | `api/admin/funnel.js` |
| SEO crawl, rules, GSC, narrative | `supabase/functions/_shared/{seo-crawl,seo-rules,gsc,seo-narrative}.ts` | `api/_lib/seo/*.js` |
| SEO action router | `supabase/functions/admin-seo/index.ts` | `api/admin/seo.js` |
| SEO tables | `supabase/migrations/20260923160000_seo_dashboard.sql` | `supabase/migrations/06x_seo_dashboard.sql` |
| Snapshot cron pattern | `supabase/functions/snapshot-billing/index.ts` | `api/cron/daily-snapshot.js` |
| Tests to carry over | `_shared/{attribution,gsc,seo-rules,funnel}.test.ts`, `FunnelOverview.test.tsx` | vitest under `api/_lib/**/*.test.js` and `src/pages/admin/` |

---

## Appendix B: Phase 0 build notes (2026-10-14)

Built on branch `admin/analytics`. Lint clean, 15 unit tests pass (`npm test`), production build succeeds. Nothing committed, nothing deployed, no migrations applied.

### What shipped

| Piece | Files |
|---|---|
| PostHog client, lazy loaded, localStorage persistence, no replay, no autocapture | `src/lib/posthog.js`, `src/components/AnalyticsIdentity.jsx` (identifies signed-in users, opts admins out), `initPostHog()` in `src/App.jsx`, `/ingest` rewrites in `vercel.json` |
| Custom events | `lead_claimed` on the calculator page, `checkout_started` in `useCheckout` |
| First-party attribution capture | `src/lib/attribution.js` (runs from `src/main.jsx` before React), `src/lib/kitFormAttribution.js` (hidden Kit custom fields on the newsletter and waitlist embeds) |
| Attribution persistence | migration `061_touch_attribution.sql`, `api/_lib/attribution.js` (validation, Stripe metadata round trip, source bucketing), wired into `api/springs101.js`, `api/checkout/create-session.js`, `api/_lib/provision-purchase.js` |
| Purchases ledger | migration `062_purchases.sql` (table, backfill from `stripe_events`, `admin_revenue_daily` view), `api/_lib/purchases.js`, webhook handlers for `charge.refunded` and `charge.dispute.*`, `POST /api/admin/analytics/settle-purchases` |
| Daily snapshots and SQL helpers | migration `063_daily_snapshots_and_admin_views.sql` (table, `admin_engagement_by_item`, `admin_engagement_daily`, `count_active_users`, `count_auth_users`, `admin_auth_users_daily`, `admin_auth_users_brief`), `api/cron/daily-snapshot.js` at 06:00 UTC |
| Kit metrics refactor | computation moved to `api/_lib/kit-metrics.js`; `api/admin/kit/metrics.js` is a thin handler |
| Shared UI kit | `src/components/admin/analytics/{shared.js,KpiCard,MetricChart,AdoptionMetric,BreakdownTable,DateRangeSelect}.jsx`, `src/components/admin/funnel/FunnelStep.jsx`; `recharts` installed |
| Routes and nav | `/admin/funnel`, `/admin/seo` placeholder pages; nav entries after Analytics |
| Analytics page, Phase 0 shape | range select, four clickable KPIs driving a period chart (net revenue, orders, new accounts, total accounts), a data sources health strip with the Settle button, then the existing engagement and per-workshop blocks |
| Cap fixes | `analytics-summary.js` and `list-users.js` no longer stop at 1000 users; engagement reads the views instead of 50k raw rows. Every migration-dependent read is soft and falls back, so the page renders before the db push |
| Tests | `api/_lib/attribution.test.js`, `src/lib/attribution.test.js`; `npm test` runs `node --test` |

### Runbook to turn Phase 0 on (dev first, then prod via the prod-deploy skill)

1. **Database.** `supabase db push` applies 061, 062, 063. 062 backfills `purchases` from `stripe_events` and flags every row for settlement.
2. **PostHog project.** Create a project (US Cloud). Copy the project API key (`phc_`) and the numeric project id. Create a personal API key with the "Query: Read" scope.
3. **Vercel env vars.** `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST=/ingest`, `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST=https://us.posthog.com`, `POSTHOG_PROD_HOST=pilatesphysics.com`. The server trio is not read by anything in Phase 0; it is the Funnel and SEO pages' dependency and the Analytics data-sources strip reports whether it is set.
4. **Stripe webhook.** In the Stripe dashboard, add `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`, `charge.dispute.funds_reinstated` to the existing endpoint's event list (test mode for dev, live for prod).
5. **Kit custom fields.** Create `utm_source`, `utm_campaign`, `referrer`, `landing_path` under Settings → Custom fields so the embedded forms' hidden inputs land. Optional; nothing breaks without them.
6. **Deploy.** Then open `/admin/analytics` and press "Settle next 25" until the ledger shows zero awaiting settlement (one Stripe read per order).
7. **Verify.** The data sources strip shows PostHog green, attribution rows appearing after the first calculator claim or purchase, purchases settled, and a snapshot row after the first 06:00 UTC run (or hit `/api/cron/daily-snapshot` with the cron secret to seed day one).

### Known limits

- Attribution exists only for accounts created after deploy. Older accounts show as "No record". A backfill from PostHog persons is possible later but not planned.
- The Kit form attribution depends on Kit's embed rendering a `<form>` into our container; if Kit changes the embed to an iframe the hidden fields stop landing. The helper fails silently.
- `purchases.settled_usd_cents` for a non-USD Adaptive Pricing order comes from the charge's balance transaction and is only correct if the Stripe balance is in USD, which it is for this account.
- The snapshot cron reads about 15 Kit endpoints once a day; the 120 per minute limit is not a concern.

---

## Appendix C: Phase 1 build notes (2026-10-14)

Built in worktree branch `claude/vigorous-bell-48ab65` on top of `admin/analytics` (19f2ff0). Lint clean, 52 unit tests pass (`npm test`), production build succeeds. Nothing committed, nothing deployed, migration 064 not applied.

### What shipped

| Piece | Files |
|---|---|
| Tabbed page, `?tab=` kept in the URL, one shared range select, range remembered per browser | `src/pages/admin/AdminAnalytics.jsx` |
| One API route per tab, each gated by `requireAdmin`, each returning independently nullable blocks plus an `errors` map | `api/admin/analytics/{revenue,products,learners,audience,engagement}.js` |
| Pure aggregation helpers, import-free and unit-tested | `api/_lib/analytics/{shared,revenue,products,learners,audience,engagement}.js` and `*.test.js`; `api/_lib/analytics/data-sources.js` reads the health strip |
| Range-aware engagement functions | migration `064_admin_engagement_functions.sql`: `admin_engagement_items(p_since)` for rankings by distinct people inside a range, `admin_engagement_hourly(p_since, p_tz)` for weekday and hour-of-day bars in Pacific time |
| Client tab components | `src/components/admin/analytics/tabs/{RevenueTab,ProductsTab,LearnersTab,AudienceTab,EngagementTab}.jsx` |
| Shared client pieces | `useTabData.js` (per-tab fetch with a `tab|range` cache and stale-while-loading), `TabFrame.jsx`, `primitives.jsx` (section headings, table cells, fraction cell, soft-error line), `DataSources.jsx` (moved from the page, with the Settle button), `BarsCard.jsx`, `LaunchChart.jsx`; `shared.js` gains `ratioSeries`, `pickDaily`, `formatDateTime`, `formatDays` |

### Tab contents

- **Revenue.** Data sources strip at the top. Five clickable KPIs (net revenue, orders, average order, repeat buyer share as "n of m · p%", refunds and disputes) driving the period chart; by product and by pricing tier tables with share of range net; launch picker with daily orders stacked early bird over full price and reference lines at the early bird close and the workshop date; Stripe fees line with net after fees and the settled-versus-presentment footnote. Every amount is charged to the order's purchase day, refunds included, so the tables always add up to the headline.
- **Products.** One row per workshop or course: paid (with scholarship count), granted, orders and net in range, opened the portal, certificates, NPS (average, responses, classic score), open questions. Expanding a row shows grants by source, reach lines, survey promoter and detractor fractions, and content items ranked by distinct openers out of enrolled, with removed items kept under their recorded label.
- **Learners.** All time by nature, and the header says so. Per course: completion funnel (enrolled, started, each module, quiz attempted, quiz passed, certificate downloaded) out of enrolled; median days from access to first module and to a passed quiz; quiz attempts, pass rate, first-try pass rate, attempts per passer; questions ranked by miss rate over graded attempts (attempts whose answer count no longer matches the question list are skipped and counted); stalled learners (access over 14 days ago, under half the modules, no pass) with a copy-emails button.
- **Audience.** Kit subscribers (live from Kit, falling back to the latest snapshot) with a snapshot trend; new accounts in range driving a period chart; leads who bought with the median gap; buyers never leads. New accounts by how they arrived (earliest entitlement); first touch, last touch, campaigns and first landing page from `touch_attribution`, with "No record" counted for accounts that have no row; recent accounts table whose rows expand into `UserActivityPanel`. PostHog geography is Phase 2 and is not read.
- **Engagement.** Active people (from `count_active_users`), logins, portal views, tool opens, content opens, all events, with a period chart; weekday and hour-of-day bars (sessions or all activity); tools and content ranked by distinct people for the range, falling back to the all-time view when 064 is not applied and labelled as such; buyers who never signed in, split by time since first purchase.

### Behaviour without migrations

Every migration-dependent read is soft. Without 062 the Revenue tab shows the health strip and an explanatory panel; Products loses its order columns. Without 063 Audience shows an explanatory panel (it needs `admin_auth_users_brief`), Engagement loses its series and the never-signed-in split, Products loses its reach columns. Without 064 Engagement rankings fall back to all time and the time-of-day panel explains itself. `api/admin/analytics-summary.js` is untouched and still feeds the Dashboard and Workshops pages.

### Runbook additions

1. `supabase db push` now also applies 064 (two plain SQL functions, no tables).
2. Nothing new in Vercel. The Audience tab's live Kit count uses the existing `KIT_API_KEY`.
3. Smoke test on dev: open `/admin/analytics`, flip through the five tabs and the range select, press Settle on the Revenue tab until the ledger shows zero awaiting lookup, expand a Products row and a Recent accounts row.

### Known limits

- Period charts bucket in the browser's local days while the server filters in UTC, so a KPI and its rightmost bar can differ by the orders placed in the overnight gap.
- Refunds are charged to the purchase day of the order they refund, not the day they were issued.
- Per-question miss rates assume the question order at grading time matches today's order; a reorder after attempts were graded would mis-attribute misses, which is why only attempts with a matching answer count are graded.
- Recording watch rate counts a click on a recording content item, not playback.

---

## Appendix D: Phase 2 build notes (2026-10-14)

Built in the `admin/analytics` checkout on top of 403a5e3 (which is also `dev`). Lint clean, 79 unit tests pass (`npm test`), production build succeeds. Nothing committed, nothing deployed. No migration.

### What shipped

| Piece | Files |
|---|---|
| PostHog HogQL client, env reader, quoting and the content filter | `api/_lib/posthog.js` (+ `posthog.test.js`). `CONTENT_PATHS` is built from `PUBLIC_ROUTES` in `api/_lib/public-routes.js` plus `/workshops` and a `RETIRED_PATHS` list, so routes, sitemap and traffic filter cannot drift. `CONTENT_PREFIXES` covers `/blog/`, `/workshops/`, `/courses/` and drops `/success` pages |
| Traffic and pre-lead queries | `api/_lib/analytics/funnel-traffic.js` (+ test): `fetchTraffic` (visitors, visits, pageviews, channel, referrer, campaign, country, US state) and `fetchPreLead` (content pages and visits per person before their first `lead_claimed`, top pages, calculator page conversion). Ported from remo's `admin-funnel-traffic/traffic.ts` without the plan split; both take the client as an argument and are tested against a fake |
| Pure funnel builder | `api/_lib/analytics/funnel.js` (+ test): steps 2 to 6 and the sources tables from purchases, subscriber_offers, user_entitlements, auth users, touch_attribution and three Kit reads |
| Routes | `api/admin/funnel.js` (our tables and Kit) and `api/admin/funnel-traffic.js` (PostHog). Both `requireAdmin`, both `maxDuration: 60` in `vercel.json` |
| Kit client | `listSubscribersCreated({ after, before })` added to `api/_lib/kit.js` |
| Step shaping | `src/lib/funnelSteps.js` (+ test): the six `FunnelStep` prop sets. The test asserts steps 4 to 6 are standalone whatever the data, the port of remo's `FunnelOverview.test.tsx` rule |
| Page | `src/pages/admin/AdminFunnel.jsx` (range select shared with Analytics and remembered per browser, product filter for steps 5 and 6), `src/components/admin/funnel/{useFunnelData.js,StepDetails.jsx,SourcesSection.jsx}`; `FunnelStep.jsx` from Phase 0 unchanged |

### How each step counts

| # | Step | Headline | Rate or denominator |
|---|---|---|---|
| 1 | Web traffic | `uniq(person_id)` of `$pageview` on content paths, `$host` = `POSTHOG_PROD_HOST` | none |
| 2 | Calculator leads | accounts whose first `lead_magnet` entitlement was granted in the window | % of step 1 |
| 3 | Entered the offer window | union by email of offers minted (`subscriber_offers.created_at`) and Kit `in-HARW-sequence` `tagged_at` in the window; both numbers and the overlap are shown | % of step 2 |
| 4 | Bought the $39 course | `purchases` with `pricing = 'offer'` | standalone: "n of m offers that expired in this window were redeemed" (`expires_at` in window) |
| 5 | Bought a core workshop | `purchases` for `webinar` or `course` kinds at full, early bird or bundle pricing, product filter applied | standalone: "n of m buyers were a lead first", with the median days from claim |
| 6 | Bought again | buyers whose second or later order fell in the window (product filter on that order) | standalone: "of N buyers who had bought before this window" (all buyers, for all time) |

Scholarship orders are not in the step 5 headline; they are shown beside it. Kit's lead count (subscribers created in the window) is reported next to the claims with the overlap by email, never added.

### Drill-downs

- **Traffic:** visits, pageviews, pages per visit; channel, referrers and campaigns by session entry; country and US state by person. Caveat line about Web Analytics.
- **Leads:** first touch, last touch, campaigns, first landing page for the window's leads (No record for accounts without a row); "before they claimed" from PostHog: measured versus unseen, median and mean content pages and visits, top pages, and the calculator page's own conversion (people who viewed `/spring-calculator` against people who claimed). The plan's "calculator interactions that never claimed" became this because the landing page has no interactive calculator; the tool is gated.
- **Entered the offer window:** offers minted, tag count and overlap, median days from claim to mint (measured n of m), nurture per-email sent, opened, clicked, unsubscribed from `kit-metrics.js` (all time, labelled so), unsubscribed during nurture.
- **Bought the $39 course:** minted, seen, redeemed, forwarded for the window's offers; redeemed on which day of the four (bar chart); by mint week; expired unused who later bought the course at full price; offers live right now.
- **Bought a core workshop:** by product, by pricing, by what came first (bought the $39 offer first, was a lead first, cold), by first touch; median days from first touch to order (measured n of m); scholarship count; link to the Revenue tab.
- **Bought again:** median days between orders, share of all buyers who bought twice, previous product then this product.
- **Sources:** first touch, last touch and campaign tables with leads, $39 buyers and core buyers per bucket, bucketed by `touchSource` from `api/_lib/attribution.js`. Counts only.

### Design decisions and deviations from section 6

- **Two routes, not one.** PostHog can take seconds or be down; `/api/admin/funnel-traffic` carries step 1 and the pre-lead panel so the five database steps never wait on it. The page merges both `errors` maps into one soft-errors line.
- **Pre-lead journeys use the `lead_claimed` event's own person**, not a join through identify. Every claim made in a browser PostHog could see is measured, not only leads who later signed in from the same browser. Unseen is the database lead count less the measured count.
- **Step 3 is a union, not a sum.** The cart tag is removed by the Kit automation after `HARW-didnotbuy`, so `tagged_at` history thins; `subscriber_offers` is the durable record and the tag fills in anyone the cron has not minted yet.
- **Kit reads:** the cart tag list, subscribers created in the window, and the cached `getKitMetrics()` build for the nurture emails. Cold, that is about 25 Kit calls against the 120 per minute limit.
- **Attribution rows with neither touch** (storage blocked) bucket as No record for campaigns as well as sources.

### Behaviour without each source

Without `purchases` (062) steps 4 to 6 show a dash and their bodies say the ledger is missing; steps 2 and 3 still count. Without `subscriber_offers` step 3 counts the Kit tag alone and step 4 loses its denominator and body. Without `touch_attribution` (061) the source breakdowns and the Sources section explain themselves. Without `KIT_API_KEY` the Kit numbers are dashes with the reason. Without `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` step 1 and the pre-lead panel read "PostHog is not configured". Nothing here is ever a 500 for a missing source.

### Runbook additions

1. No migration. Deploy only.
2. Vercel: `POSTHOG_API_KEY` (personal key, Query: Read), `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST=https://us.posthog.com`, `POSTHOG_PROD_HOST=pilatesphysics.com`. Leave `POSTHOG_PROD_HOST` at the prod host on stage too: stage then shows prod traffic, which is the useful view.
3. Smoke test: open `/admin/funnel`, flip the range and the product filter, expand all six steps, confirm the soft-errors line is empty once the PostHog vars are in.

### Known limits

- PostHog keeps a year of events by default, so "All time" for step 1 is really "as far back as PostHog has".
- Step 1 counts persons across the window; PostHog merges an anonymous person into an identified one on sign-in, so a buyer who first visited anonymously counts once.
- Kit's per-email rates are the sequence's all-time figures; Kit does not expose them per window.
- `prior_buyers` for step 6 is the count of buyers whose first order was before the window start, from the ledger, so it includes buyers of the $39 course.
- The product filter lists only products with at least one order in the ledger.
