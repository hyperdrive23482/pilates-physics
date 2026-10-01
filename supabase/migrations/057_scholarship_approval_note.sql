-- ============================================================
-- Pilates Physics: Scholarship approval note
--
-- The personal note Kaleen writes into the approval email in
-- /admin/scholarships. Saved when an approval or resend email goes out, so
-- there is a record of what each applicant was sent and the note box opens
-- with it next time. Blank means the email used the stock opening line.
-- ============================================================

alter table public.scholarship_applications
  add column approval_note text,
  add column approval_note_sent_at timestamptz;
