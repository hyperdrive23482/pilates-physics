-- ============================================================
-- The reformer course carries no NPCP CEC.
--
-- 045 seeded npcp_cecs = 1.0 on the assumption approval would land before
-- launch. It has not, and as of 2026-09-08 the course ships without one.
-- 045 now seeds null; this clears it wherever the old seed already ran.
-- Null matters beyond copy: build-certificate.js only prints the NPCP row
-- when npcp_cecs, npcp_course_id or npcp_approval_date is set, so null is
-- what turns the certificate into a plain certificate of completion.
-- If approval arrives later, set it in the admin. The certificate is built
-- at download time from the row, so re-downloads pick it up.
-- ============================================================

update public.webinars
set npcp_cecs = null
where slug = 'how-a-reformer-works'
  and npcp_cecs is not null
  and npcp_course_id is null
  and npcp_approval_date is null;
