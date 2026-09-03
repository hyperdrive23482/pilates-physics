-- ============================================================
-- Pilates Physics: Courses
--
-- Adds a fourth webinars.kind, 'course', and the schema for a product
-- that is DELIVERED IN THE PORTAL rather than on Zoom.
--
-- Why this is not just more webinar_content:
--   A workshop happens somewhere else. The app sells a seat and afterwards
--   holds a pile of artifacts, which is exactly what webinar_content is: an
--   unordered bag of attachments hanging off an event, gated on whether that
--   event has happened yet.
--   A course has no event. The sequence IS the product, and progress through
--   that sequence is what the CEC certificate is issued against. Sharing one
--   table would entangle module numbering with attachment ordering, and would
--   let a downloadable worksheet count as a module.
--
-- So: course_modules is the curriculum. webinar_content stays for
-- attachments and gains a nullable module_id so a resource can hang off one
-- module or off the course as a whole.
--
-- The webinars row itself is unchanged in role. Despite the name it is the
-- commerce and access record (Stripe price, entitlements, Kit tag, and the
-- identity the certificate prints), and all of that works for a course as-is.
--
-- Modules are deliberately NOT locked to a sequence. See course_progress.
--
-- See docs/making-of-a-reformer-course-plan.md, Phase 0.
-- ============================================================

-- ---------- 1. The 'course' kind ------------------------------
-- Public listings key on kind = 'webinar' (useWorkshops, WorkshopCatalog,
-- Education), so a course stays out of the workshop pages automatically,
-- the same way 'tool' and 'resource' already do.

alter table public.webinars drop constraint if exists webinars_kind_check;
alter table public.webinars
  add constraint webinars_kind_check
  check (kind in ('webinar', 'tool', 'resource', 'course'));

-- ---------- 2. Course settings on the product row -------------
-- A column rather than a constant in the API, so the pass mark can be
-- corrected from the admin if NPCP asks for something other than 80.
--
-- There is deliberately no `sequential` flag. Modules are freely navigable
-- (see course_progress below), so the flag would ship switched off and never
-- be switched on.

alter table public.webinars
  add column if not exists quiz_pass_pct int not null default 80;

alter table public.webinars drop constraint if exists webinars_quiz_pass_pct_check;
alter table public.webinars
  add constraint webinars_quiz_pass_pct_check
  check (quiz_pass_pct between 1 and 100);

-- ---------- 3. course_modules: the curriculum -----------------

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,

  sort_order int not null,

  title text not null,
  -- Shown under the player. Not the sales-page copy.
  summary text,

  -- The Vimeo share URL as pasted into the admin, in any of its three
  -- shapes (vimeo.com/ID/HASH, vimeo.com/ID, player.vimeo.com/video/ID?h=).
  -- Parsed at render by src/lib/vimeo.js rather than stored split, so what
  -- the admin sees is exactly what she pasted.
  --
  -- Nullable on purpose: the curriculum gets authored before the videos are
  -- shot, and a module with no URL renders as "coming soon" rather than
  -- breaking the player.
  vimeo_url text,

  duration_min int check (duration_min is null or duration_min > 0),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- DEFERRABLE matters. Reordering renumbers several rows, and a
  -- non-deferrable unique constraint fails partway through even when the
  -- final state is valid. Deferred, it is checked once at commit.
  -- Reordering must therefore happen in ONE transaction: use
  -- public.reorder_course_modules() below, not a pair of UPDATEs from the
  -- browser the way ContentEditor moves webinar_content rows.
  constraint course_modules_order_unique
    unique (webinar_id, sort_order) deferrable initially deferred
);

create index course_modules_webinar_idx
  on public.course_modules (webinar_id, sort_order);

alter table public.course_modules enable row level security;

-- Same shape as "Entitled users read content" on webinar_content in 001.
-- This is what keeps the Vimeo URLs (and their unlisted-video hashes) from
-- being readable by anyone who has not bought the course.
create policy "Entitled users read modules"
  on public.course_modules for select
  using (
    exists (
      select 1 from public.user_entitlements e
      where e.webinar_id = course_modules.webinar_id
        and e.user_id = auth.uid()
        and (e.expires_at is null or e.expires_at > now())
    )
  );

create policy "Admins full access to modules"
  on public.course_modules for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists tg_course_modules_updated_at on public.course_modules;
create trigger tg_course_modules_updated_at
  before update on public.course_modules
  for each row execute function public.touch_updated_at();

-- ---------- 4. Attachments can belong to a module -------------
-- Nullable, so every existing webinar_content row is unaffected.
-- With a module_id the item renders under that module's player; without
-- one it renders in a course-wide resources section.
-- ON DELETE SET NULL, not CASCADE: deleting a module should orphan its
-- worksheet up to the course, never silently destroy an uploaded file.

alter table public.webinar_content
  add column if not exists module_id uuid
  references public.course_modules(id) on delete set null;

create index if not exists webinar_content_module_idx
  on public.webinar_content (module_id);

-- ---------- 5. course_progress --------------------------------
-- READ THESE ROWS AS A BOOKMARK, NOT AS PROOF OF STUDY.
--
-- Modules are freely navigable and the Next button marks one done without
-- watching anything, which is deliberate: gating module N+1 on finishing N
-- polices the buyer without proving anything, and breaks anyone who
-- navigates by the module list instead of the Next button.
--
-- These rows drive resume, the progress bar, and a soft prompt on the quiz.
-- The record that carries the CEC is a passed quiz_attempts row, which is
-- the only thing here that cannot be clicked through.

create table public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

-- The PK covers lookups by user. This one is for the admin reading
-- completion across everyone on a single module.
create index course_progress_module_idx
  on public.course_progress (module_id);

alter table public.course_progress enable row level security;

-- Written straight from the browser. RLS scopes it to the signed-in user,
-- and an upsert on the primary key makes repeated Next clicks harmless.
create policy "Users manage own progress"
  on public.course_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins read progress"
  on public.course_progress for select
  using (public.is_admin());

-- ---------- 6. quiz_questions ---------------------------------
-- The answer key. Learners get NO policy at all, so RLS denies them the
-- table outright; they only ever see questions through api/course/quiz.js,
-- which runs as the service role and strips correct_index on the way out.
--
-- Admins get full access so the Quiz tab can write through the ordinary
-- browser client, the same way ContentEditor does, with no admin API route.
-- is_admin() reads the flag from the caller's own JWT, which a buyer's
-- token does not carry.

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,

  sort_order int not null,

  prompt text not null,
  -- ["choice a", "choice b", ...] in display order.
  choices jsonb not null,
  -- Zero-based index into choices.
  correct_index int not null,
  -- Shown to the learner after grading, right or wrong.
  explanation text,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint quiz_questions_choices_shape
    check (jsonb_typeof(choices) = 'array' and jsonb_array_length(choices) >= 2),
  -- Keeps a saved question answerable. Without this, an edit that removes a
  -- choice can strand correct_index past the end of the array, and the
  -- question becomes permanently unanswerable with no visible symptom.
  constraint quiz_questions_correct_in_range
    check (correct_index >= 0 and correct_index < jsonb_array_length(choices)),

  -- Deferrable for the same reason as course_modules. See
  -- public.reorder_quiz_questions() below.
  constraint quiz_questions_order_unique
    unique (webinar_id, sort_order) deferrable initially deferred
);

create index quiz_questions_webinar_idx
  on public.quiz_questions (webinar_id, sort_order);

alter table public.quiz_questions enable row level security;

create policy "Admins full access to quiz questions"
  on public.quiz_questions for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists tg_quiz_questions_updated_at on public.quiz_questions;
create trigger tg_quiz_questions_updated_at
  before update on public.quiz_questions
  for each row execute function public.touch_updated_at();

-- ---------- 7. quiz_attempts ----------------------------------
-- Every attempt is kept, not just the best one. This is the CEC audit
-- trail, and it is the answer to "prove this person earned the credit".
--
-- There is deliberately NO insert policy. Attempts are written only by
-- api/course/quiz.js with the service role, so nobody can post their own
-- passing score. Same reasoning as activity_events in 042 and
-- stripe_events in 003.

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid not null references public.webinars(id) on delete cascade,

  -- Chosen indexes in question order, as submitted.
  answers jsonb not null,

  score int not null check (score >= 0),
  total int not null check (total > 0),
  passed boolean not null,

  created_at timestamptz not null default now(),

  constraint quiz_attempts_score_within_total check (score <= total)
);

create index quiz_attempts_user_webinar_idx
  on public.quiz_attempts (user_id, webinar_id, created_at desc);

-- The certificate route asks "does a passed attempt exist for this user and
-- course, and when was the first one".
create index quiz_attempts_passed_idx
  on public.quiz_attempts (user_id, webinar_id, created_at)
  where passed;

alter table public.quiz_attempts enable row level security;

create policy "Users read own attempts"
  on public.quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Admins read all attempts"
  on public.quiz_attempts for select
  using (public.is_admin());

-- ---------- 8. Reordering -------------------------------------
-- Both curriculum tables carry a deferrable unique constraint on
-- (webinar_id, sort_order), so a reorder has to land in ONE transaction.
-- The browser cannot do that across two supabase-js calls, which is how
-- ContentEditor moves webinar_content rows today. These functions renumber
-- the whole list from an ordered array of ids in a single statement.
--
-- Pass every id for the course, in the order they should end up.

create or replace function public.reorder_course_modules(
  p_webinar_id uuid,
  p_module_ids uuid[]
)
returns void
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'reorder_course_modules: admin only';
  end if;

  update public.course_modules m
     set sort_order = ord.idx - 1
    from unnest(p_module_ids) with ordinality as ord(id, idx)
   where m.id = ord.id
     and m.webinar_id = p_webinar_id;
end;
$$;

create or replace function public.reorder_quiz_questions(
  p_webinar_id uuid,
  p_question_ids uuid[]
)
returns void
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'reorder_quiz_questions: admin only';
  end if;

  update public.quiz_questions q
     set sort_order = ord.idx - 1
    from unnest(p_question_ids) with ordinality as ord(id, idx)
   where q.id = ord.id
     and q.webinar_id = p_webinar_id;
end;
$$;

-- Belt and braces on top of the is_admin() guard inside each function.
-- Guarded because 'anon' is a Supabase-provided role: without this, the file
-- aborts anywhere that role is absent (a local validation database, for
-- instance) and every statement after it is silently skipped.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke execute on function public.reorder_course_modules(uuid, uuid[]) from anon;
    revoke execute on function public.reorder_quiz_questions(uuid, uuid[]) from anon;
  end if;
end
$$;

-- ---------- 9. Activity events --------------------------------
-- Three course events alongside the existing set from 042. Engagement
-- evidence for chargeback disputes, and the raw material for "who actually
-- worked through this".

alter table public.activity_events drop constraint if exists activity_events_event_type_check;
alter table public.activity_events
  add constraint activity_events_event_type_check
  check (event_type in (
    'login',
    'portal_view',
    'dashboard_view',
    'content_click',
    'tool_open',
    'download',
    'certificate_download',
    'checkout_start',
    'purchase',
    'entitlement_granted',
    'lead_magnet_claim',
    'module_complete',
    'quiz_submit',
    'course_complete'
  ));
