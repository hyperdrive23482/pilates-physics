-- ============================================================
-- Pilates Physics: link workshop_feedback to authenticated users
-- so the in-portal survey can attribute responses to a logged-in
-- user (skipping the name/email form) and prevent duplicate
-- submissions. user_id stays nullable so the public /survey-101
-- form keeps working for non-logged-in respondents.
-- ============================================================

alter table public.workshop_feedback
  add column user_id uuid references auth.users(id) on delete set null;

-- One submission per user per workshop (only enforced when user_id is set —
-- anonymous public submissions are still allowed to duplicate).
create unique index idx_workshop_feedback_user_workshop_unique
  on public.workshop_feedback (user_id, workshop_title, workshop_date)
  where user_id is not null;

-- Lets a logged-in user see their own feedback rows (used by the portal
-- dashboard banner to decide whether to prompt for feedback).
create policy "Users read own workshop_feedback"
  on public.workshop_feedback for select
  using (user_id = auth.uid());
