-- ============================================================
-- The reformer course carries 1 NPCP CEC after all.
--
-- NPCP approved it on 2026-09-11 and the paperwork arrived on 2026-09-13. This
-- reverses 049, which cleared npcp_cecs on 2026-09-08 because approval had not
-- landed before launch. 045's seed comment and 049's whole premise are
-- historical; this is the current state.
--
-- All three fields are set together on purpose. build-certificate.js prints the
-- NPCP block once ANY of them is non-null, falling back to an em dash for the
-- others -- so a partial fill produces "1.0 / — / —" on a document someone
-- submits for continuing education. Seeding all three keeps dev and prod
-- identical and keeps that half-filled state from ever rendering.
--
-- npcp_approval_date is a `date` (migration 024), and formatDateOnly reads it in
-- UTC, so the literal below prints as "September 11, 2026" with no timezone
-- drift either side of it.
--
-- The quiz is what actually carries the credit: quiz_attempts is the audit
-- trail and quiz_pass_pct (default 80) is the threshold. Both exist from 044.
-- ============================================================

update public.webinars
set npcp_cecs          = 1.0,
    npcp_course_id     = '20245-10188',
    npcp_approval_date = date '2026-09-11'
where slug = 'how-a-reformer-works'
  and (
    npcp_cecs is distinct from 1.0
    or npcp_course_id is distinct from '20245-10188'
    or npcp_approval_date is distinct from date '2026-09-11'
  );
