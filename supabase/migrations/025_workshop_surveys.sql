-- ============================================================
-- Pilates Physics: Admin-configurable per-workshop surveys
--
-- Stores each workshop's survey definition (timing + question list)
-- as jsonb on the webinars row. workshop_feedback gains a webinar_id
-- foreign key plus a flexible `responses jsonb` payload, so new
-- workshops with different question sets can write through the same
-- table. Existing typed columns (nps_score, years_teaching, etc.)
-- stay populated when values match the legacy CHECK enums — that
-- keeps PP-101 historical analytics working unchanged.
-- ============================================================

-- 1. survey_config on the webinar
alter table public.webinars
  add column if not exists survey_config jsonb;

-- 2. Flexible response storage + direct FK to the workshop
alter table public.workshop_feedback
  add column if not exists responses jsonb,
  add column if not exists webinar_id uuid references public.webinars(id) on delete set null;

create index if not exists idx_workshop_feedback_webinar
  on public.workshop_feedback (webinar_id, created_at desc);

create unique index if not exists idx_workshop_feedback_user_webinar_unique
  on public.workshop_feedback (user_id, webinar_id)
  where user_id is not null and webinar_id is not null;

-- 3. Relax NOT NULL on typed question columns. Future workshops may
--    omit any of these; the CHECK enums still constrain values when set.
alter table public.workshop_feedback
  alter column years_teaching   drop not null,
  alter column nps_score        drop not null,
  alter column change_this_week drop not null,
  alter column aha_moment       drop not null,
  alter column valuable_sections drop not null,
  alter column rushed_section   drop not null,
  alter column confusing        drop not null,
  alter column length_feedback  drop not null,
  alter column share_permission drop not null;

-- 4. Backfill webinar_id on existing rows (PP-101 today, harmless for
--    everything else). Match on title + date so anonymous + authed
--    rows alike pick up the link.
update public.workshop_feedback wf
   set webinar_id = w.id
  from public.webinars w
 where wf.webinar_id is null
   and wf.workshop_title = w.title
   and wf.workshop_date = (w.scheduled_at at time zone 'UTC')::date;

-- 5. Seed PP-101's survey_config so the existing live survey keeps
--    working through the new code path with no admin action required.
--    The question option strings match the legacy CHECK enums verbatim,
--    so the typed-column mirror in the new API will populate cleanly.
update public.webinars
   set survey_config = jsonb_build_object(
     'enabled', true,
     'opens_at', '2026-05-20T13:00:00-07:00',
     'closes_at', '2026-06-01T00:00:00-07:00',
     'admin_email', null,
     'questions', jsonb_build_array(
       jsonb_build_object(
         'id', 'years_teaching',
         'type', 'single_select',
         'label', 'How many years have you been teaching Pilates?',
         'required', true,
         'options', jsonb_build_array(
           'I''m not an instructor',
           'I am in teacher training',
           '<1 year',
           '1-3 years',
           '4-9 years',
           '10+ years'
         )
       ),
       jsonb_build_object(
         'id', 'nps_score',
         'type', 'nps',
         'label', '1. On a scale of 1-10, how likely are you to recommend this workshop to another Pilates instructor?',
         'required', true
       ),
       jsonb_build_object(
         'id', 'change_this_week',
         'type', 'long_text',
         'label', '2. What''s one thing from today that''s going to change how you teach this week?',
         'required', true
       ),
       jsonb_build_object(
         'id', 'aha_moment',
         'type', 'long_text',
         'label', '3. What was your favorite "aha" moment from the workshop?',
         'required', true
       ),
       jsonb_build_object(
         'id', 'valuable_sections',
         'type', 'multi_select',
         'label', '4. Which section was most valuable for you? (check all that apply)',
         'required', true,
         'options', jsonb_build_array(
           'Framework',
           'Background Physics',
           'Practical Application',
           'Wrap-Up Challenge worksheet'
         )
       ),
       jsonb_build_object(
         'id', 'rushed_section',
         'type', 'single_select',
         'label', '5. Was there a section that felt rushed, or that you wanted more time with?',
         'required', true,
         'options', jsonb_build_array(
           'Framework',
           'Background Physics',
           'Practical Application',
           'Wrap-Up',
           'Nothing — pacing felt right'
         )
       ),
       jsonb_build_object(
         'id', 'confusing',
         'type', 'long_text',
         'label', '6. Was anything confusing or that you''d want explained differently? (this is where you tell me what to fix)',
         'required', true
       ),
       jsonb_build_object(
         'id', 'length_feedback',
         'type', 'single_select',
         'label', '7. How was the overall length?',
         'required', true,
         'options', jsonb_build_array(
           'Could''ve been shorter',
           'Just right',
           'Could''ve been longer'
         )
       ),
       jsonb_build_object(
         'id', 'share_permission',
         'type', 'single_select',
         'label', '8. Can I share your feedback? I sometimes quote student feedback publicly to help other instructors decide if this workshop is for them.',
         'required', true,
         'options', jsonb_build_array(
           'Yes, with my first name',
           'Yes, but keep me anonymous',
           'No, please keep my responses private'
         )
       ),
       jsonb_build_object(
         'id', 'next_workshop_topic',
         'type', 'long_text',
         'label', '9. What would you like to learn in the next workshop? (optional)',
         'required', false
       ),
       jsonb_build_object(
         'id', 'anything_else',
         'type', 'long_text',
         'label', '10. Anything else you want me to know? (optional)',
         'required', false
       )
     )
   )
 where slug = 'PP-101-May-2026'
   and (survey_config is null or survey_config = 'null'::jsonb);

-- 6. Safety-net inserts for PP-102 and PP-201 — only fires if the
--    row doesn't already exist (PP-102's marketing page expects the
--    PP-102-July-2026 slug; PP-201 is new and currently has no page).
insert into public.webinars (slug, title, subtitle, status)
values
  ('PP-102-July-2026', 'Pilates Physics 102', 'Chair & Cadillac mechanics', 'upcoming'),
  ('PP-201-TBD', 'Pilates Physics 201', 'Coming soon', 'draft')
on conflict (slug) do nothing;
