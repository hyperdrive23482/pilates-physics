# Course Launch Lifecycle Checklist

The manual steps to launch one Pilates Physics course, from building it to
wrapping up after it runs.

**How to use this:** Copy this file for each launch (for example
`docs/launches/<slug>.md`), fill in the values table, set your real dates in
the timeline, and check off each box as you go. `T-0` is the day the course
runs, so `T-30` means 30 days before. The app automates a lot of the work, so
read "What the app does automatically" below before you start, so you do not
repeat it by hand.

## Launch values

Fill these in once at the start of the launch.

| Field | Value |
|-------|-------|
| Course title | |
| Slug | |
| Price | |
| Date and time | |
| Duration (minutes) | |
| Stripe Price ID | |
| Kit tag | |
| Early-signup bonus item | |
| Early-bird deadline | |

## Timeline

| Phase | When | Your date |
|-------|------|-----------|
| 1. Build the course | T-45 to T-30 | |
| 2. Announce, open registration | T-30 | |
| 3a. Early-bird last call | ~T-17 | |
| Early-bird window closes | per launch (~T-14) | |
| 3b. One-week reminder | ~T-7 | |
| 4. Right before the course | T-2 to T-0 | |
| Course runs | T-0 | |
| 5. After the course | T+1 to T+7 | |

## What the app does automatically

You do not need to do any of this by hand:

- **On a successful purchase:** creates or links the buyer's account, grants
  their entitlement, sends the magic-link login email to new and returning
  buyers, emails you a purchase notification, applies the workshop's Kit tag,
  and grants the early bonus if the purchase falls inside the bonus window.
- **About an hour after the start time:** flips the workshop from `upcoming`
  to `awaiting_recording`.
- **Scheduled blog and content pieces:** publish on their own.

Everything below is manual.

---

## Phase 1 - Build the course (T-45 to T-30)

Set everything up while the workshop status is `draft`. Nothing is public
until you flip the status in Phase 2.

- [ ] **Create the workshop.** Go to `/admin/workshops/new`. Fill in title,
  slug, subtitle, description, price (entered in cents, e.g. `4900` for $49),
  date and time, duration, and hero image. Leave the status as `draft`.
- [ ] **Create the Stripe product.** In the Stripe dashboard, create a Product
  for this course with a one-time Price. Copy the Price ID (it starts with
  `price_`).
- [ ] **Link Stripe to the workshop.** Paste the Price ID into the workshop's
  "Stripe price ID" field and save. Checkout cannot run without it.
- [ ] **Set the Kit tag.** Add a Kit tag on the workshop (for example the
  slug, or `<slug>-buyers`). Buyers are tagged with it automatically at
  purchase, so you can target them later.
- [ ] **Build the landing page.** Fill the "What's Included" section. Date,
  time, duration, and price display automatically. Add any always-available
  content items on the Content tab.
- [ ] **CEC course only:** fill the NPCP fields (CECs, course ID, approval
  date).
- [ ] **Choose the early-signup bonus item.** Decide what free item early
  buyers will get (an existing tool, animation, or past recording). Confirm it
  already exists as a workshop or tool. If it does not, create it now. You
  will wire it up in Phase 2.
- [ ] **Proofread.** Review all copy (no em dashes). Preview the sales page at
  `/workshops/<slug>` while it is still `draft`. Only you can see it.

## Phase 2 - Announce and open registration (T-30)

This is launch day for sales. Once you flip the status, the page is public and
checkout is live.

- [ ] **Configure the early bonus.** In the workshop's "Early registration
  bonus" section, pick the bonus workshop or tool, set the bonus start to now,
  and set the bonus end to your early-bird deadline. All three fields must be
  filled together. Anyone who buys inside this window gets the bonus
  automatically.
- [ ] **Open registration.** Flip the workshop status to `upcoming`.
  Registration only works at `upcoming` or `live`, so nothing sells before
  this.
- [ ] **Run a test purchase.** In Stripe test mode, buy the course end to end:
  checkout, success page, entitlement granted, magic-link email received.
  Confirm it works, then clean up the test data.
- [ ] **Add the announcement bar.** At `/admin/announcements`, create a site
  banner. Set its start to now and its end to the early-bird deadline. Mention
  the course and the early bonus.
- [ ] **Send the announcement email.** In Kit, send a broadcast to your full
  list: the offer, the early bonus, the deadline, and a clear button to
  `/workshops/<slug>`.
- [ ] **Post everywhere else.** Share on social and any other channels you use.

## Phase 3 - Reminders

### 3a. Early-bird last call (~T-17, a few days before the bonus deadline)

- [ ] **Send the "last chance for the bonus" email.** Kit broadcast. Consider
  targeting subscribers who are not yet tagged as buyers, so you do not
  re-pitch people who already registered.
- [ ] **On the deadline date:** confirm the bonus window has closed (the bonus
  end date has passed). Update or remove the announcement bar.

### 3b. One-week reminder (~T-7)

- [ ] **Send the "one week to go" email.** Kit broadcast: what attendees will
  learn, what to expect, and a final nudge to register.
- [ ] **Refresh the announcement bar.** Drop the bonus language and emphasize
  the date and that registration is still open.

## Phase 4 - Right before the course (T-2 to T-0)

Make sure every registrant can get in and the logistics are correct.

- [ ] **Check the Zoom details.** Confirm the workshop's Zoom link and
  passcode are set and correct.
- [ ] **Check for failed purchases.** Review the `stripe_events` table for any
  rows with status `failed` or `kit_failed` since you announced. For anyone
  missing access, grant it with `/api/admin/grant-entitlement`.
- [ ] **Spot-check access.** Confirm a registrant or a test account can reach
  the portal at `/portal/<slug>`.
- [ ] **Review pre-event questions.** Read anything submitted under the
  workshop's questions so you can prep answers.
- [ ] **Send the day-before email.** Kit broadcast to registrants with the
  Zoom link, passcode, date, and time.
- [ ] **Go live.** On the day, flip the status to `live`. Send a short
  "starting soon" nudge a couple of hours before.

## Phase 5 - After the course (T+0 to T+7)

- [ ] **No action needed:** about an hour after the start time, the workshop
  auto-flips from `upcoming` to `awaiting_recording`.
- [ ] **Upload the recording.** Set the recording URL and add a `recording`
  content item set to available after the webinar. The status moves to
  `complete`.
- [ ] **Add post-event resources.** Upload any slides or downloads as content
  items.
- [ ] **Send the follow-up email.** Kit broadcast to the buyer tag: thank you,
  the recording link, and any downloads.
- [ ] **Collect feedback.** Open or confirm the post-workshop survey and
  review responses as they arrive.
- [ ] **CEC course only:** issue NPCP certificates to attendees.
- [ ] **Clean up.** Remove the announcement bar if it is still showing.
- [ ] **Archive.** Once the recording window has passed, set the status to
  `archived`.
- [ ] **Retro.** Note what worked and what to change for the next launch.

---

## Reference

### Workshop statuses

| Status | Meaning |
|--------|---------|
| `draft` | Private, not visible |
| `upcoming` | Public, registration open |
| `live` | Running, registration still open |
| `awaiting_recording` | Ended, recording not posted (set automatically ~1h after start) |
| `complete` | Recording posted |
| `archived` | Retired |

Registration only works while a workshop is `upcoming` or `live`.

### Admin tools for fixing access

- `/api/admin/grant-entitlement` - give one person access
- `/api/admin/bulk-grant-entitlement` - give many people access
- `/api/admin/revoke-entitlement` - remove access
- `/api/admin/apply-bonus-backfill?webinar_id=<id>` - re-run the early bonus
  for past buyers who missed it

### Key URLs

- `/admin/workshops/new` - create a workshop
- `/admin/announcements` - manage the site banner
- `/workshops/<slug>` - public sales page
- `/portal/<slug>` - gated attendee portal

### Where to watch for problems

The `stripe_events` table logs every purchase. Rows with a status of `failed`
or `kit_failed`, or an email status of `failed`, mean a purchase needs manual
attention.
