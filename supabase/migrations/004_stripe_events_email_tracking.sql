-- ============================================================
-- Pilates Physics: Track post-purchase magic-link email sends
-- The Stripe webhook now sends magic-link emails via Resend
-- (auth.admin.generateLink only generates the URL, it does not
-- send). These columns record per-event email outcome so silent
-- failures show up in the audit trail.
-- ============================================================

alter table public.stripe_events
  add column if not exists email_status text
    check (email_status in ('sent', 'failed', 'skipped')),
  add column if not exists email_error text;

-- skipped: branch (a) — buyer was already logged in, no email needed
-- sent:    branch (b) or (c) — Resend accepted the send
-- failed:  branch (b) or (c) — Resend rejected; entitlement still granted
