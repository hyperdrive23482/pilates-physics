# The Making of a Reformer: Course Product Plan

The plan for a new product type. Not a workshop with videos attached, but a
course delivered inside the portal: eight modules in a set sequence, each one a
Vimeo video, a scored ten-question quiz at the end, and an NPCP certificate
issued on a pass. Nothing is locked, so the sequence is a path rather than a
gate. Public landing page at $69, linked from the education page.

Companion to two existing docs:

- [making-of-a-reformer-build-plan.md](making-of-a-reformer-build-plan.md)
  owns the $39 four-day subscriber offer: the Kit flow, the token cron, the
  offer page, and the checkout branch. **None of that is in this plan.** It
  builds on top of what this plan ships, and its own build order puts it last.
- [reformer-machine-course-spec.md](marketing/working-drafts/reformer-machine-course-spec.md)
  owns content, module outline, positioning, and copy rules.

Written 2026-09-02 against the `dev` branch. Nothing here exists in code yet.
The only reference to the product in the app is the "Coming soon" card in
`src/pages/Education.jsx`.

## Why this is not a workshop with videos attached

An earlier draft of this plan reused the workshop machinery: modules as
`webinar_content` rows of type `recording`, authored in the existing Content
tab. That was wrong, and the reason is worth stating because it shapes
everything below.

**A workshop is delivered somewhere else.** It happens on Zoom, on a date, at a
time. The app sells a seat, stores the Zoom link, and afterwards holds a pile
of artifacts: the replay, the slides, a download or two. `webinar_content` is
exactly right for that. It is an unordered bag of attachments hanging off an
event, and its fields say so: `available_after` is `always` or `post_webinar`,
because the only question that matters is whether the event has happened yet.

**A course is delivered here.** There is no event. The product *is* the
sequence, and the order is the pedagogy: friction only lands after springs and
pulleys. Progress through that sequence is the thing being tracked, and
completing it is what earns the CEC.

Those are different enough that sharing one table hurts in specific ways:

| Problem | Consequence |
|---|---|
| `sort_order` is shared across modules and attachments | Adding a worksheet between modules 3 and 4 renumbers the curriculum |
| `type = 'recording'` means "replay of a past event" | `WorkshopPortal` already filters on it, and `available_after: post_webinar` gates on an event that never happens |
| No per-module fields | A module needs a runtime, a summary shown under the player, and a video reference. A content item has a title and a URL |
| Progress would key on `content_id` | A download is a valid `content_id`, so a progress bar counts the worksheet as a module and "3 of 8" stops being true |

So: **a new `course_modules` table for the curriculum, and the existing
`webinar_content` kept for attachments,** now optionally scoped to a module.
The worksheet in module 2 stays a content item, because that is what it is.

**The `webinars` row stays.** Despite the name, it is the commerce and access
record: Stripe price, entitlements, Kit tag, magic link, admin grants, and the
identity the certificate prints. All of that works for a course unchanged. It
is the product row. `course_modules` is the curriculum.

## What the request pins down

| Item | Value |
|------|-------|
| Where it lives | The portal, at `/portal/making-of-a-reformer` |
| Delivery | In the portal, in a defined order, freely navigable |
| Modules | 8, one Vimeo video each |
| Navigation | Previous and Next, with a module list always visible |
| Assessment | 10 questions, scored, at the end |
| Certificate | Auto-generated NPCP PDF on a pass, same design as workshops |
| Landing page | Public, at `/making-of-a-reformer` |
| Price | $69, one-time |
| Access | Instant on purchase, no expiry |
| CEC | 1 NPCP CEC |
| Entry point | The existing placeholder card on `/education` |

## Decisions

| Item | Decision | Why |
|------|----------|-----|
| Product row | One `webinars` row, `kind = 'course'`, `status = 'live'` | Checkout, entitlements, Kit tag, magic link, and the certificate all key off it. `live` passes the checkout gate unchanged |
| Curriculum | New `course_modules` table, ordered, one row per module | See above. The sequence is the product |
| Attachments | `webinar_content` kept, with a nullable `module_id` | Reuses the storage bucket, upload widget, and signed-URL path. A resource can belong to a module or to the course |
| Video reference | `vimeo_url` on the module, parsed at render | Admin pastes the share URL. No id is ever hard-coded in the app |
| Order enforcement | **None.** The modules have an order and Next follows it, but every module is reachable at any time | Decided 2026-09-03. Gating the next module on watching the last one polices the buyer without proving anything. The quiz is the real assessment |
| Completion signal | Next marks the module done. The Vimeo `ended` event marks it too | Both are "reached the end of this module", not "watched it". See below |
| What progress means | `course_progress` is a bookmark, not evidence | It drives resume, the progress bar, and a soft prompt on the quiz. **The CEC evidence is the passed quiz attempt**, which is the only thing here that cannot be clicked through |
| Quiz | `quiz_questions` and `quiz_attempts`, graded server-side | Answers must never reach the browser. Every attempt stored as the CEC audit trail |
| Pass mark | Stored on the course row, default 80% | **Confirm against NPCP self-study rules.** A column, not a constant, so it is fixable without a deploy |
| Retakes | Unlimited | Standard for self-study. Every attempt is kept |
| Certificate | Existing PDF and route, with a course branch | Same document as the workshops. Swaps the status gate for a passed-quiz gate and prints the completion date |
| Admin | A course-shaped editor, not the workshop editor | The point of this revision. See Phase 1 |
| Landing page | Bespoke, in the shape of `PilatesPhysics101.jsx` | Every landing page here is bespoke. Body split out so the offer page can reuse it |
| Kit tag | `MOR-purchased`, exactly | The offer plan's Kit automations key on this string |
| Migrations | Start at `044` | `042` and `043` are activity logging. The offer plan's numbers are stale |

## What the app already does for free

Once the `webinars` row exists with a Stripe price, all of this works with no
new code, because it hangs off the product row rather than the delivery model:

- Checkout at `POST /api/checkout/create-session`
- Account creation or linking, entitlement upsert, magic-link email, owner
  notification, and Kit tagging, all inside `provisionPurchase`
- The success page, which polls `verify-session` and links to the portal
- The access gate for anyone without an entitlement
- Admin comp access, bulk grants, and revokes
- Activity logging for checkout, purchase, entitlement, and portal views

The new work is the curriculum table, the course authoring screen, the portal
player, the quiz, and the certificate branch.

---

## Phase 0: Schema

> **Built 2026-09-03.** Both migrations are written and validated against a
> throwaway PostgreSQL 18 instance, replaying migrations 001 through 042 plus
> these two, with the Supabase `auth` schema stubbed. Thirteen behavioural
> tests cover RLS on every new table, the check constraints, reordering, and
> seed idempotency.
>
> **Pushed to dev (`pilates-physics-dev`) 2026-09-03** and verified: the four
> tables exist, the course row carries the right price, Kit tag, CEC count and
> pass mark, and the anon key reads zero rows from all four, so RLS is live.
> **Prod is still pending** and ships with the rest of the course.
>
> Three things came out differently from the spec below, all recorded in the
> migration comments:
>
> 1. **The unique constraints on `(webinar_id, sort_order)` are DEFERRABLE**,
>    for both `course_modules` and `quiz_questions`. A plain unique constraint
>    fails partway through a reorder even when the final ordering is valid.
> 2. **Two reorder functions ship with the schema**, `reorder_course_modules`
>    and `reorder_quiz_questions`. A deferred constraint only helps inside one
>    transaction, and the browser cannot span one across two supabase-js
>    calls, which is how `ContentEditor` moves `webinar_content` rows today.
>    Each renumbers a whole list from an ordered array of ids and refuses a
>    non-admin caller. Phase 1 should call these rather than paired updates.
> 3. **The module seed uses `where not exists`, not `on conflict`.**
>    PostgreSQL will not infer a deferrable constraint for `ON CONFLICT`. The
>    guard is also safer: a re-run can never overwrite a Vimeo URL or summary
>    edited in the admin.
>
> Also added beyond the spec: check constraints keeping `correct_index` inside
> the `choices` array and `score` inside `total`, a partial index on passed
> attempts for the certificate lookup, and an `updated_at` trigger on both new
> editable tables.

### `supabase/migrations/044_courses.sql`

- [ ] Add `'course'` to the `webinars_kind_check` constraint, currently
      `webinar | tool | resource` per migration 034.

- [ ] One course setting on `webinars`, only meaningful when
      `kind = 'course'`:

```sql
alter table public.webinars
  add column if not exists quiz_pass_pct int not null default 80;
```

A column rather than a constant, so the pass mark can be corrected from the
admin if NPCP asks for something other than 80.

There is deliberately **no `sequential` column.** An earlier draft had one, on
by default. Modules are freely navigable, so the flag would ship switched off
and never be switched on. If a future course wants a locked path it is one
migration away, and adding the knob before anything needs it is how dead
settings accumulate.

- [ ] `course_modules`, the curriculum

```sql
create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  sort_order int not null,
  title text not null,
  summary text,                     -- shown under the player
  vimeo_url text,                   -- the share URL, parsed at render
  duration_min int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (webinar_id, sort_order)
);
alter table public.course_modules enable row level security;

-- Same shape as the existing "Entitled users read content" policy on
-- webinar_content: only a buyer with a live entitlement sees the module,
-- which is what keeps the Vimeo hashes out of public reach.
create policy "Entitled users read modules" on public.course_modules
  for select using (
    exists (
      select 1 from public.user_entitlements e
      where e.webinar_id = course_modules.webinar_id
        and e.user_id = auth.uid()
        and (e.expires_at is null or e.expires_at > now())
    )
  );

create policy "Admins full access to modules" on public.course_modules
  for all using (public.is_admin()) with check (public.is_admin());
```

`vimeo_url` is nullable on purpose. The curriculum gets authored before the
videos are shot, and a module with no URL renders as "coming soon" rather than
breaking the player.

- [ ] Scope attachments to a module

```sql
alter table public.webinar_content
  add column if not exists module_id uuid
  references public.course_modules(id) on delete set null;
```

Nullable, so nothing existing changes. A row with a `module_id` shows under
that module's player. A row without one shows in a course-wide resources
section. This is where the spring calculator link, the inspection checklist,
and the worksheet live.

- [ ] `course_progress`

```sql
create table public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
alter table public.course_progress enable row level security;
create policy "own progress" on public.course_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins read progress" on public.course_progress
  for select using (public.is_admin());
```

The browser writes this directly. RLS scopes it to the signed-in user, and an
upsert on the primary key makes repeated Next clicks harmless.

**Read these rows as a bookmark, not as proof of study.** Nothing stops a buyer
clicking Next eight times, and by design nothing should. They drive resume, the
progress bar, and the quiz checkpoint. The record that carries the CEC is the
passed `quiz_attempts` row.

- [ ] `quiz_questions`

```sql
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  sort_order int not null,
  prompt text not null,
  choices jsonb not null,           -- ["A", "B", "C", "D"]
  correct_index int not null,
  explanation text,                 -- shown after grading
  unique (webinar_id, sort_order)
);
alter table public.quiz_questions enable row level security;

-- Admins only. Learners get no policy at all, so RLS denies them the table
-- outright and the answer key never reaches a buyer's browser. They see
-- questions through api/course/quiz.js, which strips correct_index.
create policy "Admins full access to quiz questions" on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());
```

- [ ] `quiz_attempts`

```sql
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  webinar_id uuid not null references public.webinars(id) on delete cascade,
  answers jsonb not null,           -- chosen indexes, in question order
  score int not null,
  total int not null,
  passed boolean not null,
  created_at timestamptz not null default now()
);
create index on public.quiz_attempts (user_id, webinar_id, created_at desc);
alter table public.quiz_attempts enable row level security;
create policy "read own attempts" on public.quiz_attempts
  for select using (auth.uid() = user_id);
create policy "Admins read all attempts" on public.quiz_attempts
  for select using (public.is_admin());
-- Inserts are service-role only, so nobody can write their own passing score.
```

- [ ] Add `'module_complete'`, `'quiz_submit'`, and `'course_complete'` to the
      `activity_events` type constraint from migration 042.

### `supabase/migrations/045_making_of_a_reformer_seed.sql`

- [ ] The product row:

```sql
insert into public.webinars
  (slug, title, subtitle, description, status, kind, price_cents,
   duration_min, kit_tag, npcp_cecs)
values
  ('making-of-a-reformer', 'The Making of a Reformer',
   'How your machine works and why', '<description, no em dashes>',
   'live', 'course', 6900, 60, 'MOR-purchased', 1.0)
on conflict (slug) do update set
  kind = 'course', status = 'live', price_cents = 6900,
  kit_tag = 'MOR-purchased';
```

`stripe_price_id`, `npcp_course_id`, and `npcp_approval_date` stay null and get
filled in from the admin, because the ids differ between dev and prod.

- [ ] Eight `course_modules` rows from the spec outline, `vimeo_url` null:

| # | Title | Min |
|---|-------|-----|
| 0 | Introduction | 3 |
| 1 | Reformer anatomy | 6 |
| 2 | Springs | 14 |
| 3 | Reformer adjustments | 10 |
| 4 | Pulleys | 7 |
| 5 | Friction | 8 |
| 6 | Classical vs contemporary | 5 |
| 7 | How we consider the body | 3 |

Seeded so dev and prod start identical. Everything about them is editable in
the admin afterwards.

- [ ] Quiz questions are **not** seeded. They get typed into the Quiz tab once
      it exists. The spec's open item "write the ten quiz questions" is still
      open, and a migration is the wrong home for copy that will be revised.

### Push

- [ ] `supabase db push` to dev, verify, then prod per the deploy runbook. All
      of it is additive.

---

## Phase 1: Course authoring in the admin

Built before the portal, because the portal renders what this produces.

> **Built 2026-09-03.** Lint and production build both clean. Not yet
> exercised in a browser, and not committed.
>
> Files added: `src/lib/vimeo.js`, `src/components/admin/CurriculumEditor.jsx`,
> `QuizEditor.jsx`, `CourseResultsPanel.jsx`, `api/admin/course-results.js`,
> and `supabase/migrations/046_reorder_grants.sql`.
> Changed: `WorkshopForm.jsx`, `AdminWorkshopEdit.jsx`, `AdminWorkshops.jsx`,
> `ContentEditor.jsx`, `api/admin/clone-workshop.js`.
>
> Differences from the spec below:
>
> 1. **A Results tab shipped with this phase** rather than being deferred,
>    along with `api/admin/course-results.js`. It needs the service role,
>    because `auth.users` is not joinable through PostgREST, which is the same
>    reason `workshop-enrollments.js` exists.
> 2. **`ContentEditor` gained a `moduleFilter` prop** instead of a second
>    component being written. It scopes the list to one module, to the
>    course-wide items, or to everything, so per-module attachments reuse the
>    existing upload and signed-URL handling untouched.
> 3. **Migration 046 fixes a flaw in 044.** The `revoke execute ... from anon`
>    at the end of 044 has no effect, because PostgreSQL grants EXECUTE to
>    PUBLIC by default and revoking from one role leaves that inheritance in
>    place. Confirmed against dev: an anon-key call reached the function body.
>    Nothing was exposed, since the `is_admin()` guard is the real control and
>    it held, but the revoke read as protection while providing none. **046
>    still needs pushing.**
> 4. **Cloning copies the curriculum and quiz**, remapping each attachment to
>    its copied module. `quiz_pass_pct` was added to the cloned fields.

### A course editor, not the workshop editor

`AdminWorkshopEdit.jsx` currently shows six fixed tabs built around a live
event. Make the tab set depend on `kind`:

| Tab | Webinar | Course |
|-----|---------|--------|
| Details | yes | yes, with different fields |
| Curriculum | no | **new** |
| Quiz | no | **new** |
| Results | no | **new** |
| Content | yes | folded into Curriculum |
| Pre-workshop Q&A | yes | no |
| Post-workshop survey | yes | optional, keep |
| Feedback | yes | keep |
| Enrolled users | yes | keep |

- [ ] Derive `TABS` from `workshop.kind` instead of the current module-level
      constant.

### Details, made course-aware

- [ ] Add a `kind` selector to `WorkshopForm.jsx`. It has none today, so every
      row created at `/admin/workshops/new` takes the column default,
      `webinar`. This is why every tool and resource so far arrived by
      migration. Offer `webinar`, `tool`, `resource`, `course`, and lock it
      once the row exists, because changing kind on a live product moves it
      between portal renderers.

- [ ] Hide the event fields when kind is `course`: Zoom link, Zoom passcode,
      scheduled at, recording URL. None of them apply, and leaving them on
      screen is how a course ends up with a stale Zoom link.

- [ ] Show one course field instead: the pass mark percentage, with a line of
      help text.

- [ ] Compute total runtime from the module durations and write it to
      `duration_min` on save. The certificate prints that number, so deriving
      it stops the PDF from disagreeing with the curriculum. Show it read-only
      with a note saying where it comes from.

- [ ] The NPCP panel already exists and needs no change. Filling CECs, course
      id, and approval date is what puts the NPCP row on the certificate.

### `CurriculumEditor.jsx`

The main new screen. Model it on `ContentEditor.jsx`, which already has the row
list, inline edit form, reorder arrows, and delete confirm this needs.

- [ ] A numbered, reorderable list of modules. Each row shows its number,
      title, runtime, and a green or grey dot for whether a video is attached.
- [ ] Inline edit per module: title, summary, Vimeo URL, runtime.
- [ ] **Validate the Vimeo URL on entry.** Run it through `parseVimeoUrl` and
      show the parsed id and hash, or a plain "not a Vimeo URL I recognise".
      This is the one mistake that is otherwise invisible until a buyer hits a
      dead player. Accept all three share formats.
- [ ] Show a thumbnail once the URL parses, so a wrong-but-valid link is
      caught too. Vimeo's oEmbed endpoint returns one without an API key.
- [ ] Attachments per module, inline: reuse `ContentEditor`'s row UI filtered
      to `module_id = <this module>`, with the existing `FileUpload` widget.
      Course-wide attachments keep a section of their own.
- [ ] A completeness banner at the top: "8 modules, 61 minutes, 8 videos
      attached" or "2 modules missing a video", so the state of the course is
      readable at a glance.

### `QuizEditor.jsx`

- [ ] Ordered question list, same interaction pattern.
- [ ] Per question: prompt, four choice inputs, a correct-answer radio, and an
      optional explanation shown to the learner after grading.
- [ ] A "10 of 10 questions" counter against the pass mark, because a pass mark
      is meaningless if the count drifts.
- [ ] Refuse to save a question with fewer than two choices or no correct
      answer marked.

**No API route needed.** The admin policies in Phase 0 are written against
`public.is_admin()`, which reads the flag from the caller's own JWT. A buyer's
token does not carry it and there is no other policy, so RLS denies buyers the
table outright. The editor writes through the browser Supabase client exactly
as `ContentEditor` does.

### Where courses appear in the admin

A `course` row is currently invisible in both lists: `AdminWorkshops.jsx:19`
filters `kind === 'webinar'` and `AdminTools.jsx:15` filters for `tool` and
`resource`.

- [ ] Widen `AdminWorkshops.jsx` to list every kind behind a filter control,
      defaulting to workshops. This also fixes the clone source list, which
      filters the same way and so would not offer a course to copy from.

`api/admin/clone-workshop.js` already copies `kind`, so once a course is
visible there, duplicating one as the starting point for the chair edition
works. It will need extending to copy `course_modules` and `quiz_questions`
alongside the content rows.

---

## Phase 2: Portal delivery

> **Built 2026-09-03.** Lint and production build clean. Not yet opened in a
> browser, and not committed.
>
> Added: `src/hooks/useCourse.js` (modules and progress),
> `src/hooks/useCourseSummaries.js` (dashboard progress),
> `src/components/portal/course/` with `CoursePlayer.jsx`, `ModuleList.jsx`,
> `VimeoEmbed.jsx` and `course.css`.
> Changed: `WorkshopPortal.jsx`, `PortalDashboard.jsx`, `WorkshopCard.jsx`,
> `StatusBadge.jsx`, `api/portal/activity.js`.
>
> Differences from the spec below:
>
> 1. **`isPlainWorkshop` replaced every `!isInteractive` guard** in
>    `WorkshopPortal`. Those guards meant "not a tool", which silently became
>    wrong once a third kind existed: a course would have rendered the Zoom
>    panel, the certificate section and the description block underneath its
>    own player. Now the three delivery models are named explicitly.
> 2. **The quiz row renders a placeholder.** It is reachable and honest about
>    not being open yet. Phase 3 replaces the component; nothing else changes.
> 3. **`module_complete` was added to the client event whitelist** in
>    `api/portal/activity.js`, with a comment recording that it asserts
>    advancing past a module, not watching it.
> 4. **The dashboard card resumes rather than restarts.** `useCourseSummaries`
>    fetches modules and progress for every owned course in two queries, and
>    the card links to `?module=<first unfinished>`.

### Dashboard

- [ ] `PortalDashboard.jsx`: add a Courses section above Tools, filtering
      `kind === 'course'`. The card shows progress, "3 of 8 modules", and
      deep-links to the current module rather than the course root.

### The course renderer

- [ ] `WorkshopPortal.jsx`: branch on `kind === 'course'` before the existing
      `isInteractive` check, rendering `<CoursePlayer>` and skipping the
      workshop chrome entirely. The access gate, admin bypass, and
      `portal_view` logging stay in front of it.

Fetch modules from `course_modules` ordered by `sort_order`, attachments from
`webinar_content`, and progress from `course_progress`.

### Components under `src/components/portal/course/`

- [ ] `src/lib/vimeo.js` with `parseVimeoUrl(url)` returning `{ id, hash }` or
      null. Accepts `vimeo.com/ID/HASH`, `vimeo.com/ID`, and
      `player.vimeo.com/video/ID?h=HASH`. Shared with the admin validator, and
      worth a unit test since both sides depend on it.

- [ ] `VimeoEmbed.jsx`. Lift `FootworkVideo.jsx` into a component taking id,
      hash, title, and `onEnded`. Keep `dnt=1`, `badge=0`, `title=0`,
      `byline=0`, `portrait=0` and the 16:9 wrapper. Add `api=1` and listen for
      the player's `ended` message so completion can be detected without the
      SDK.

- [ ] `ModuleList.jsx`. The sidebar: number, title, runtime, a completion
      check, and the active state. **Every row is clickable from the first
      visit.** No locks and no disabled states, so the list doubles as the
      syllabus. Collapses to a dropdown on narrow screens. The quiz is the last
      row, and it is open too.

- [ ] `CoursePlayer.jsx`. Owns the current module.
      - Current module comes from `?module=N` via `useSearchParams`, so
        refresh and deep links hold their place. Any valid module number is
        accepted, including on a first visit.
      - Opening with no `?module` jumps to the first incomplete module, or the
        quiz when everything is done. This is a convenience, not a gate.
      - Next marks the current module done, then advances. On the last module
        it reads "Take the quiz".
      - Previous never changes progress.
      - Vimeo `ended` also marks it done. A nicety that keeps the progress bar
        honest for someone who watches through and closes the tab, and fine to
        cut if the postMessage listener proves fiddly. Nothing depends on it.
      - A module with no `vimeo_url` renders a "coming soon" card, and Next
        still works, so a missing video never traps anyone.
      - Attachments for the current module render under the player.

There is no order enforcement anywhere in this component. Someone who wants to
watch friction first can, and someone re-taking the course a year later does
not have to click through seven modules to reach the one they came back for.

- [ ] `useCourseProgress.js`. Loads progress for the user and course, exposes
      the completed set, `markComplete(moduleId)` with an optimistic upsert,
      and `allComplete`.

- [ ] Log `module_complete` through the existing client activity path.

Styling reuses `Workshop.css` and `ppv2.css`. Springs 101 is the closest
existing reference for a multi-part portal product.

---

## Phase 3: The quiz

### `api/course/quiz.js`

Both methods behind `requireUser` plus an entitlement check. Extract that check
from `api/certificate/[workshopId].js` into `api/_lib/require-entitlement.js`
and use it from both.

- [ ] `GET` returns the questions ordered, with `correct_index` and
      `explanation` stripped, plus the user's best attempt so far. Entitlement
      is the only gate.

**No progress gate on the quiz.** An earlier draft returned 403 until every
module had a progress row. With free navigation that check protects nothing,
because eight Next clicks clear it in ten seconds, and it introduces a real
failure: someone who navigates by the module list instead of the Next button
never marks some modules done, and gets locked out of the assessment they paid
for. A gate that stops honest buyers and nobody else is worth deleting.

Instead, `CourseQuiz` shows a soft note when progress is incomplete, along the
lines of "you have not opened modules 4 and 6 yet", with the quiz still
available underneath. It informs without blocking.

The CEC is defensible without the gate. The quiz is the assessment, it is
scored server-side against a pass mark, and every attempt is stored. Clicking
through the modules was never the evidence.

- [ ] `POST` takes `{ webinarId, answers }`. Grades against the table, inserts
      a `quiz_attempts` row with the service role, reads the pass mark from
      `webinars.quiz_pass_pct`, logs `quiz_submit`, logs `course_complete` on
      the first pass, and returns score, total, passed, and per-question
      correctness with explanations.

      **Never return the correct index for a missed question,** only whether it
      was right plus the explanation, or the answer key can be assembled by
      retaking.

### `CourseQuiz.jsx`

- [ ] Ten questions, submit enabled once all are answered.
- [ ] The soft incomplete-progress note above the questions, when it applies.
- [ ] Result screen: score, pass or fail, per-question feedback, and either a
      certificate button or a retake button.
- [ ] A passed attempt is remembered. Reopening the quiz after a pass shows the
      pass screen, not a fresh attempt.
- [ ] Retakes refetch rather than reusing the previous answers.

---

## Phase 4: Certificate

- [ ] `api/certificate/[workshopId].js`: branch on `kind`. For a course, drop
      the status gate and require a passed `quiz_attempts` row instead. Use the
      earliest passed attempt as the completion date.
- [ ] Extend the existing admin bypass to cover that gate, so the PDF can be
      previewed without sitting the quiz. Print a placeholder date in that
      case.
- [ ] `build-certificate.js`: accept an optional `completedAt` and print it in
      the DATE cell in place of `scheduled_at`. DURATION already reads
      `duration_min`, which Phase 1 now derives from the modules. No layout
      change.
- [ ] `CertificateButton` and `useCertificateDownload` work unchanged. Render
      the button on the quiz pass screen and on the dashboard course card. The
      existing missing-name prompt covers courses too.

The NPCP audit trail is the `quiz_attempts` row plus the existing
`certificate_download` activity event. No certificates table needed.

---

## Phase 5: Landing page and routing

### `src/pages/MakingOfAReformer.jsx` at `/making-of-a-reformer`

- [ ] Build it in the shape of `PilatesPhysics101.jsx`: const arrays at the
      top, mapped into the existing card markup, styled with `ppv2.css` and
      `Workshop.css`. Resolve the product by slug.
- [ ] Put the body in `src/components/course/CourseSalesBody.jsx` and the
      pricing card in `PricingBlock.jsx`. The offer plan needs exactly this
      split later, and it is cheap now.

Sections, drawing copy from the spec:

1. Hero. "You own more machine than you are using." Plain-language subline.
   Meta strip: 8 modules, about an hour, 1 NPCP CEC, instant access, $69.
2. Who it is for, and the ladder: calculator, this course, PP101.
3. The eight modules with runtimes and a line each. This is the syllabus the
   nurture emails already promise.
4. The design story. Three or four decisions named, in the "here is the
   decision, here is what it does to load, here is what I chose" shape.
5. What you get: video, quiz, certificate, resources, lifetime access.
6. CEC block: 1 NPCP CEC, earned by passing the quiz.
7. Bio.
8. FAQ: do I need PP101 first, how long do I have access, what if I fail.
9. Pricing card. $69, and no mention of any discount, ever.

- [ ] The buy button. Extract `RegisterCard`'s submit handler into a
      `useCheckout(slug)` hook and call it from `PricingBlock`. `RegisterCard`
      renders workshop date copy that a course has no use for, and the offer
      page will want the same hook.

- [ ] Copy rules: no em dashes, title and subtitle travel together, "your
      machine" in the subline and description, no "Physics" in the title.

### Routing

- [ ] Add the `/making-of-a-reformer` route beside the PP101 and PP102 routes.
- [ ] `workshopUrl`: add
      `if (slug === 'making-of-a-reformer') return '/making-of-a-reformer'`.
- [ ] `BrandedWorkshopRedirect`: change the guard from
      `url.startsWith('/pilates-physics')` to ``url !== `/workshops/${slug}` ``.
      Without it, `/workshops/making-of-a-reformer` renders the generic sales
      page as a second copy of the product, and that is also where Stripe sends
      abandoned checkouts.
- [ ] `create-session.js` needs no change. Add a comment on the status gate
      saying courses pass as `live` deliberately.

### Education page

- [ ] Update the first `PATHS` entry: `meta: '$69. 1 NPCP CEC. Instant
      access'`, `ctaLabel: 'Learn more'`, `to: '/making-of-a-reformer'`, and
      drop "Coming soon".
- [ ] The hero says "Five ways to learn" over six cards. Fix the count.

### Noted, not in scope

- There is no per-page meta, sitemap, or robots handling anywhere on the site.
  The landing page ships with the global title like every other page. The offer
  page will eventually need `noindex`, which is its own small project.
- The `/workshops` catalog filters on `kind === 'webinar'`, so the course will
  not appear there.

---

## Making another webinar without touching code

Asked directly, so answered directly: **this already works, and always has.**

`/admin/workshops/new` inserts a `webinars` row straight from the form under
the admin policy in migration 002. No migration, no deploy. Everything the
purchase flow needs is on that form: title, slug, subtitle, description, price
in cents, status, date and time, duration, Zoom link and passcode, recording
URL, hero image, Kit tag, Stripe price id, the three NPCP fields, and the
early-bird bonus window.

`/admin/workshops/new?from=<slug>` clones one instead, copying content items
and survey config while deliberately blanking what belonged to the session
being copied: date, Zoom details, recording, and the Kit tag. That last one is
blanked on purpose, since a Kit tag grants access and should be a deliberate
paste.

**The slug prefix decides which landing page features it.** `PP-101-` puts it
on the 101 page as the next upcoming session, `PP-102-` on the 102 page, and
anything else gets the generic sales page. The form's tooltip documents this.

| Task | Admin or code |
|------|---------------|
| A new session of PP101 or PP102 | Admin, start to finish |
| A one-off workshop on the generic sales page | Admin, start to finish |
| A new series with its own branded landing page | Code. Landing pages are bespoke and `workshopUrl` needs the prefix |
| A new tool or resource | Code today. Admin once the `kind` selector ships |
| **A second course** | **Admin, once this plan lands.** Create it, set kind to course, author the curriculum and quiz. Only a bespoke landing page needs code |
| The Stripe product and price | Stripe dashboard, then paste the id into the form |
| The Kit tag itself | Kit dashboard. Tags resolve by name, and a missing one records `kit_failed` against the purchase |

That last row is the real return on this phase. The chair and tower editions
the spec describes become content work rather than engineering work.

---

## Manual steps outside the repo

| Step | Where | When |
|------|-------|------|
| Stripe Product and a one-time $69 Price, test and live | Stripe dashboard | Before the test purchase |
| Paste the Price id onto the course | Admin, dev then prod | Same |
| Create the `MOR-purchased` tag | Kit | Before the first sale |
| Upload eight videos, Unlisted with a hash, embeds restricted to the site domains | Vimeo | Before launch |
| Paste the share URLs into the modules | Admin, Curriculum tab | After upload |
| NPCP course id and approval date | Admin, Details tab | When NPCP issues them |
| Write and enter the ten questions | Admin, Quiz tab | Before launch |

---

## Test plan

Dev with Stripe test mode, then a real card on prod, refunded.

- [ ] Buy as a new email. Magic link arrives, the course appears under Courses,
      the entitlement is `source = 'stripe'`, and Kit carries `MOR-purchased`.
- [ ] Buy while already entitled. The 409 links to the portal.
- [ ] Cancel at Stripe. Lands on the landing page, not the generic one.
- [ ] Module 1 plays. Next completes it and advances. Previous does not
      complete. Refresh holds position. Letting a video end marks it complete.
- [ ] **Free navigation:** on a brand new account, every module in the sidebar
      is clickable, and typing `?module=5` opens module 5. Nothing is locked.
- [ ] A module with no video shows "coming soon" and Next still advances.
- [ ] The quiz opens on a fresh account with no modules marked done, and shows
      the incomplete-progress note rather than blocking.
- [ ] Reaching the quiz by clicking through the module list, never using Next,
      works the same as reaching it by Next. This is the case the old progress
      gate would have broken.
- [ ] Fail, see feedback with no answer key, retake, pass. Two attempts stored,
      one `course_complete` event.
- [ ] Certificate downloads with the right name, title, completion date, total
      runtime, and the NPCP row once those fields are set.
- [ ] A certificate request before passing returns 403. An admin preview works.
- [ ] Query `course_modules` with an anon key as a non-buyer. Zero rows, so the
      Vimeo hashes do not leak.
- [ ] Admin: create a throwaway course from scratch, author two modules and two
      questions, and confirm it renders in the portal. This is the real test of
      whether the authoring story works.
- [ ] Mobile layout for the player and module list.

---

## Build order

1. Phase 0 schema, pushed to dev.
2. Phase 1 admin authoring. Before the portal, because the portal renders what
   it produces, and because it replaces seed migrations as the way content
   gets in.
3. Phase 2 portal delivery, against modules authored in step 2.
4. Phase 3 quiz.
5. Phase 4 certificate.
6. Phase 5 landing page, routing, education card.
7. Real videos, real questions, NPCP fields, live Stripe price, test plan,
   ship.

The offer plan picks up after step 7.

## Open questions

- [ ] NPCP pass mark for self-study. 80% assumed, and now a column.
- [ ] NPCP course id and approval date. The spec still marks the CEC
      unconfirmed for on-demand delivery. This brief says 1 CEC, so confirm
      before the landing page is public.
- [ ] The ten questions and explanations. Typed into the admin, so they do not
      block the build.
- [ ] The eight Vimeo URLs.
- [ ] Should completed courses appear anywhere besides the portal dashboard?
- [ ] Hero image for the landing page and dashboard card.
