# Mentorship Program Spec (Fall 2026 cohort)

Source of truth for the first cohort of Kaleen's 8-week mentorship. Update this
file first, then the page and the product.

## Program at a glance

| Field | Value |
|-------|-------|
| Name | Kaleen's 8-week mentorship program |
| For | Pilates teachers with less than 5 years of experience |
| Dates | October 21 to December 16, 2026 |
| Applications close | October 8, 2026 (read in the order they arrive) |
| Group meetings | Wednesdays, 9:00 to 10:30am Pacific (GMT-7 Oct 21 and 28, GMT-8 from Nov 4; US clocks change Nov 1) |
| Week off | November 25 (Thanksgiving week) |
| Sessions | 8 group sessions, all recorded |
| Private sessions | 2 x 60-minute virtual mentoring sessions with Kaleen |
| Contact hours | 14 (8 x 1.5h group + 2 x 1h private) |
| Format | Virtual, small group |
| Recording tool | Free access to Remo to record your teaching and share it with Kaleen for review |
| Price | $399 one-time, or 2 payments of $229 ($458 total) |

## Schedule

| Week | Date | Session |
|------|------|---------|
| 1 | Oct 21 | Welcome + movement session |
| 2 | Oct 28 | The art of teaching + review first assignment |
| 3 | Nov 4 | Pilates Physics: the equipment |
| 4 | Nov 11 | Pilates Physics: the human body |
| 5 | Nov 18 | Strength and Pilates |
| off | Nov 25 | No session (Thanksgiving week) |
| 6 | Dec 2 | Movement session + discussion |
| 7 | Dec 9 | Office hours |
| 8 | Dec 16 | Recap cohort teaching metrics, review progress + 30 min office hours |

## What we cover

- **Say less, teach more.** The cues, flow, presence, programming, and feedback
  that make a class feel personal, in a 1:1 and in a mixed-level room.
- **Pilates that builds strength.** The principles of strength training and how
  to program them into your classes.
- **Why the same setting is a different workout.** How equipment delivers load,
  and how the body changes exercise difficulty.

Week titles as they appear on the page (confirmed 2026-09-28):

| Week | Title |
|------|-------|
| 1 | Welcome and a movement session |
| 2 | Say less, teach more, and your first recording reviewed |
| 3 | How the equipment delivers load |
| 4 | How the body changes the load |
| 5 | Pilates that builds strength |
| 6 | Movement session, then we talk about it |
| 7 | Office hours |
| 8 | Your progress, measured |

Admission is **by application** (`/mentorship/apply`), not open checkout.

## Open decisions

- **Enrollment cap.** "Small group" needs a number on the page, both for
  scarcity and so we know when to close checkout.
- **Private session scheduling.** Booked by the mentee via a link in the
  welcome email, or assigned by Kaleen? Fixed weeks, or any time in the 8 weeks?
- **First assignment.** Week 2 reviews it, so it goes out with the welcome
  email in week 1. What is it?
- **Remo access.** Who provisions it and when? Welcome email is the simplest
  place to put the instructions.
- **Refund policy.** Cohort programs usually need one stated on the page.

## What is built (dev, 2026-09-28)

- **`/mentorship`** (`src/pages/Mentorship.jsx`): the landing page. Borrows
  the `workshop-*` section classes like the course page does; `Mentorship.css`
  adds only the week-by-week schedule and the apply card extras.
- **`/mentorship/apply`** (`src/pages/MentorshipApply.jsx`): the application
  form. Posts to `/api/inquiry` with `kind: 'mentorship'`. Kaleen gets the
  application by email (Resend), the applicant gets an acknowledgement.
- **Shared constants** in `src/lib/mentorship.js` (prices, paths, option
  lists). The option values must match `api/inquiry.js` and the labels in
  `api/_lib/resend.js`.
- **Cross-links:** an Education card (now "Seven ways to learn") and the Help
  page mentorship answer.

Admission and payment are manual: read the application, reply, send a Stripe
invoice for the option they picked, confirm the spot when it clears.

## Not built yet

1. **Stripe checkout.** `api/checkout/create-session.js` runs in
   `mode: 'payment'` only. The one-time price could reuse it with a product row;
   the two-payment plan needs a subscription price with a 2-cycle schedule or
   Stripe's installment option, plus webhook handling so the entitlement is
   granted on the first payment and revoked if the second fails. Invoicing by
   hand is fine for a small first cohort.
2. **A portal home** for the recordings. The page promises recordings "in your
   portal", which today means a workshop or course entitlement. Either grant a
   workshop-style entitlement by hand or post recordings by email until one
   exists.
3. **A seat cap** and a "cohort full" state on the page.
