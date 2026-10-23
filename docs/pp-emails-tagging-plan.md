# pp-emails tagging plan

Goal: every Pilates Physics contact (workshop or course buyer, newsletter or
waitlist signup, spring calc claim) carries the Kit tag `pp-emails`, so it can
be told apart from the `hl-*` contacts that will share this Kit account.

Audit date: 2026-10-22.

## Audit findings

### Kit (via the Kit MCP)

- The tag is named **`pp-emails`** (plural, id `24917743`). Code must use that
  exact string. Created 2026-10-23 01:58 UTC.
- **All 675 active subscribers have it.** Active total is 675, tag count is 675.
  This came from a one-time bulk tag, not from an ongoing rule.
- **None of the 64 inactive subscribers have it.** These are mostly people who
  submitted the double opt-in newsletter form and never confirmed (example:
  a 2026-10-19 "Newsletter Signup" form entry with no tags at all).
- No webhooks exist. The API cannot read Kit automations or form settings,
  so nothing confirms that new signups will be tagged going forward. Nobody
  has signed up since the tag was created, so there's no new signup to check
  against either.
- `hl-*` tags (including `hl-emails`, `hl-newsletter`, `hl-waitlist`) exist
  with 0 subscribers. A second brand is being set up in the same account.

### Site code

| Flow | Code | Tags applied | pp-emails |
|---|---|---|---|
| Workshop / course purchase | `api/_lib/provision-purchase.js:239` | `webinars.kit_tag` only, and only if set | No |
| Spring calc | `api/springs101.js:161` | `spring-calc` only | No |
| Newsletter | `NewsletterForm.jsx`, Kit form `fcf1f6c520` ("Newsletter Signup") | Set inside Kit | Depends on Kit |
| Waitlist | `WaitlistForm.jsx`, Kit form `2e05d54bb3` | Set inside Kit | Depends on Kit |
| Admin grant / bulk grant | `api/admin/grant-entitlement.js`, `bulk-grant-entitlement.js` | None (no Kit call) | No |

### Related risk found during the audit

Site broadcasts (`api/admin/content/approve.js:99`, `draft-in-kit.js:52`,
`pieces.js:248`) send to **every subscriber** when a content piece has no
audience tags. Once `hl-*` contacts exist, a Pilates Physics newsletter sent
with no audience set would also reach the HL list.

## Plan

### 1. Code: always apply pp-emails on the server paths

- In `api/_lib/kit.js`, add `export const PP_BRAND_TAG = 'pp-emails'` and a
  `tagPpContact(email, firstName)` helper that runs `tagSubscriber` with it.
- `provision-purchase.js`: apply `pp-emails` on **every** purchase, even when
  the workshop has no `kit_tag`. Run it in its own try/catch, separate from the
  product tag, so one failing can't block the other. Add its failures to
  `kitError` so the webhook still marks the event `kit_failed`.
- `springs101.js`: same, separate from `spring-calc`.
- Admin grants: optional. Comped users are PP contacts, so tag them too.
  Never fail the grant because of it.

### 2. Kit: tag form signups (done in the Kit dashboard)

The site can't touch these forms, so Kit has to do it:

- Automations > Rules: **Subscribes to form "Newsletter Signup"** then
  **Add tag `pp-emails`**.
- Same rule for the waitlist form.
- Same rule for any other PP form or landing page that is still live.
- For double opt-in forms, Kit fires these rules when the subscriber
  confirms, which is the moment they become active. Good.

### 3. Kit: backfill the 64 inactive subscribers

Tag all 64 now with `pp-emails`. Adding a tag sends them nothing, and all of
them are PP signups (no HL contacts exist yet). Then if one of them confirms
later, or buys and gets activated through `KIT_PURCHASE_FORM_ID`, they already
have the tag. The Kit MCP can do this once you approve it.

### 4. Broadcasts: stop "no audience" from meaning "everyone"

- In `approve.js`, `draft-in-kit.js` and `pieces.js`, default an empty
  `kit_tag_ids` to `[pp-emails id]`, or refuse to send with no audience.
- Default the admin content audience selector to `pp-emails`.

### 5. Ongoing check

Add a "missing brand tag" number to `/admin/kit` (`api/_lib/kit-metrics.js`)
and to the daily snapshot:

`active subscribers - pp-emails count - hl-emails count`

Kit can't filter for "missing a tag", so this is the cheapest drift alarm.
It should stay at 0, and anything above 0 means some signup path skipped
the tag. (If one person can be on both lists, the number can drop below 0.
In that case, compare against the larger of the two tag counts instead.)

### 6. Verify after deploy

- Run a $0 or test-mode purchase, claim the spring calc with a fresh email,
  and submit and confirm the newsletter form. Each should show `pp-emails`
  within a minute.
- Check the missing-brand-tag number reads 0.

## Status (2026-10-22)

- Step 1 done on dev, uncommitted: `PP_BRAND_TAG` / `tagPpContact` in
  `kit.js`, wired into `provision-purchase.js`, `springs101.js` and
  `admin/grant-entitlement.js`. Bulk grant skipped on purpose: it only grants
  to people who already hold another product, so they are already PP contacts.
- Step 3 done: all 64 inactive subscribers tagged, no failures.
- Found during step 3: `tasneemalk@outlook.com` is tagged `PP 101 - May 2026`
  but has been inactive since April, so she has been left out of broadcasts.
  She bought before the inactive-buyer activation fix existed. Added to the
  purchase form (9930844) and confirmed active.
- Step 4 done on dev, uncommitted: `buildSubscriberFilter` in `kit.js` always
  ANDs in pp-emails (tests in `kit.test.js`); the content piece audience hint
  now says so. Unverified against Kit: whether Kit accepts a filter group with
  both `all` and `any` set. Check by drafting one broadcast with a picked tag
  and reading its audience in the Kit UI.
- Step 5 done on dev, uncommitted: `loadBrandDrift` in `kit-metrics.js`,
  shown on `/admin/kit` (stat card plus a red alert when above 0) and written
  to the daily snapshot as `kit.brand_tag_missing`.
- Steps 2 and 6 pending.

## Order

1 and 3 first (code plus backfill covers every API path immediately), then 2
(the user does it in Kit), then 4 before the first HL contact arrives, then 5.
