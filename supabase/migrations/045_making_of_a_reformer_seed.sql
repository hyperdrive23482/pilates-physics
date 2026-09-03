-- ============================================================
-- Pilates Physics: The Making of a Reformer
--
-- Seeds the first course: the product row plus its eight modules, so dev
-- and prod start from the same curriculum. Everything seeded here is
-- editable afterwards in the admin (Details and Curriculum tabs); the seed
-- exists so the two environments do not drift, not because the app needs
-- hard-coded content.
--
-- Deliberately NOT seeded:
--   stripe_price_id       differs between the test and live Stripe accounts
--   npcp_course_id        not issued yet
--   npcp_approval_date    not issued yet
--   vimeo_url             videos not shot yet; modules render "coming soon"
--   quiz_questions        the ten questions are unwritten, and a migration
--                         is the wrong home for copy that will be revised.
--                         They get typed into the Quiz tab.
--
-- kit_tag MUST stay exactly 'MOR-purchased'. provisionPurchase applies
-- whatever string sits in that column, and the Kit automations trigger on
-- that exact name. Rename it and buyers keep receiving the sales sequence
-- for a course they already own, silently. Migration 039 records the same
-- trap one product earlier.
--
-- status = 'live' is intentional and is what passes the purchasability gate
-- in api/checkout/create-session.js. It is not purchasable yet regardless,
-- because that route also requires stripe_price_id, which is null until the
-- Stripe price is pasted into the admin. kind = 'course' keeps the row out
-- of every public listing, which all filter on kind = 'webinar'.
--
-- See docs/making-of-a-reformer-course-plan.md, Phase 0.
-- ============================================================

-- ---------- The product row -----------------------------------

insert into public.webinars
  (slug, title, subtitle, description,
   status, kind, price_cents, duration_min, kit_tag, npcp_cecs)
values (
  'making-of-a-reformer',
  'The Making of a Reformer',
  'How your machine works and why',
  'An on-demand course on the reformer as a machine. Eight modules covering everything that changes load before a body gets on the carriage: what each part does, how springs behave and age, what every adjustment does to stretch, how the ropes and pulleys relate rope travel to carriage travel, and why friction is not the problem most teachers think it is. Taught by someone who designed a reformer, so every module opens with a decision that had to be made and closes with what was chosen and why.',
  'live',
  'course',
  6900,
  60,
  'MOR-purchased',
  1.0
)
on conflict (slug) do update set
  title        = excluded.title,
  subtitle     = excluded.subtitle,
  description  = excluded.description,
  status       = excluded.status,
  kind         = excluded.kind,
  price_cents  = excluded.price_cents,
  duration_min = excluded.duration_min,
  kit_tag      = excluded.kit_tag,
  npcp_cecs    = excluded.npcp_cecs,
  updated_at   = now();

-- ---------- The eight modules ---------------------------------
--
-- Runtimes come from the course spec's outline and total 56 minutes of
-- module content, plus roughly 5 for the quiz. webinars.duration_min above
-- is set to 60, and Phase 1 derives that number from these rows on save so
-- the certificate cannot disagree with the curriculum.
--
-- Guarded with NOT EXISTS rather than ON CONFLICT on purpose. The unique
-- constraint on (webinar_id, sort_order) is DEFERRABLE so that reordering
-- works, and PostgreSQL will not use a deferrable constraint for ON CONFLICT
-- inference. NOT EXISTS is unambiguous, and it also means a re-run can never
-- overwrite a Vimeo URL or a summary edited in the admin.

insert into public.course_modules
  (webinar_id, sort_order, title, duration_min, summary)
select
  w.id, m.sort_order, m.title, m.duration_min, m.summary
from public.webinars w
cross join (values
  (0, 'Introduction', 3,
   'What the course covers, and why a machine you use every day still has things to tell you.'),
  (1, 'Reformer anatomy', 6,
   'The vocabulary. Which parts change load and which do not, and how four competing size constraints shaped the machine you stand on.'),
  (2, 'Springs', 14,
   'The core module. Spring anatomy, Hooke''s law, what makes a spring stiff, how springs age and where the law stops applying, how brands differ, and how to look at your own.'),
  (3, 'Reformer adjustments', 10,
   'Every dial and what it does to spring stretch, with nobody on the machine. Including the second-order effects: change one thing and three others move.'),
  (4, 'Pulleys', 7,
   'Why "half" is half true. How rope travel relates to carriage travel, and where the load actually peaks.'),
  (5, 'Friction', 8,
   'The myth-bust, worked as an argument. Rolling against starting friction, the fact that friction reverses direction with the carriage, and the one case where a teacher would genuinely notice it.'),
  (6, 'Classical vs contemporary', 5,
   'Same exercise, different load, neither wrong. Physics takes no side, and the design tradeoffs are stated as one designer''s requirements rather than a verdict.'),
  (7, 'How we consider the body', 3,
   'The one thing the machine cannot tell you, and where Pilates Physics 101 picks up.')
) as m(sort_order, title, duration_min, summary)
where w.slug = 'making-of-a-reformer'
  and not exists (
    select 1 from public.course_modules cm
    where cm.webinar_id = w.id
      and cm.sort_order = m.sort_order
  );
