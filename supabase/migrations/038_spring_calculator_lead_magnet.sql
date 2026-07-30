-- ============================================================
-- Pilates Physics: Spring Load Calculator becomes the lead magnet
--
-- /api/springs101 now grants only the calculator, so the Kit tag has to
-- live on the calculator row instead of the springs-101 row (which the
-- handler no longer fetches). The tag NAME stays 'springs-101' on purpose:
-- the six-email evergreen nurture sequence in Kit is triggered by that tag,
-- and renaming it here would silently stop the sequence for new subscribers.
--
-- The springs-101 row is deliberately left untouched. Everyone who already
-- claimed the primer keeps their entitlement and /portal/springs-101, and
-- the row is preserved for use elsewhere. New signups simply never get it.
--
-- Safe to re-run.
-- ============================================================

update public.webinars
   set kit_tag = 'springs-101'
 where slug = 'spring-load-calculator';
