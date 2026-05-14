-- ============================================================
-- Pilates Physics: Workshop feedback (post-workshop surveys)
-- One row per submission. workshop_title + workshop_date scope
-- the responses so the table serves every workshop, not just PP-101.
-- ============================================================

create table public.workshop_feedback (
  id uuid primary key default gen_random_uuid(),
  workshop_title text not null,
  workshop_date date not null,
  name text not null,
  email text not null,
  years_teaching text not null check (years_teaching in (
    'I''m not an instructor','I am in teacher training','<1 year','1-3 years','4-9 years','10+ years'
  )),
  nps_score smallint not null check (nps_score between 1 and 10),
  change_this_week text not null,
  aha_moment text not null,
  valuable_sections text[] not null check (
    array_length(valuable_sections, 1) >= 1
    and valuable_sections <@ array[
      'Framework','Background Physics','Practical Application','Wrap-Up Challenge worksheet'
    ]
  ),
  rushed_section text not null check (rushed_section in (
    'Framework','Background Physics','Practical Application','Wrap-Up','Nothing — pacing felt right'
  )),
  confusing text not null,
  length_feedback text not null check (length_feedback in (
    'Could''ve been shorter','Just right','Could''ve been longer'
  )),
  share_permission text not null check (share_permission in (
    'Yes, with my first name','Yes, but keep me anonymous','No, please keep my responses private'
  )),
  next_workshop_topic text,
  anything_else text,
  created_at timestamptz not null default now()
);

alter table public.workshop_feedback enable row level security;

create policy "Public can submit workshop feedback"
  on public.workshop_feedback for insert
  with check (length(name) between 1 and 200 and length(email) between 3 and 320);

create policy "Admins full access to workshop_feedback"
  on public.workshop_feedback for all
  using (public.is_admin())
  with check (public.is_admin());

create index idx_workshop_feedback_workshop
  on public.workshop_feedback (workshop_date desc, workshop_title);
create index idx_workshop_feedback_created
  on public.workshop_feedback (created_at desc);
