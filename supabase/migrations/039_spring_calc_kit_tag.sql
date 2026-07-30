-- ============================================================
-- Pilates Physics: point the calculator lead magnet at the "spring-calc" Kit tag
--
-- 038 parked the historical 'springs-101' tag on the calculator row so the
-- existing nurture sequence would keep firing. A dedicated 'spring-calc' tag
-- now exists in Kit, so use it: the tag name finally matches what the
-- subscriber actually receives, and lead-magnet reporting stops being
-- entangled with the primer.
--
-- IMPORTANT: the six-email nurture sequence in Kit was triggered by the
-- 'springs-101' tag. Re-point that automation at 'spring-calc' or new
-- subscribers will be tagged and then never enter the sequence.
--
-- 038 is already applied remotely, so this has to be a new migration rather
-- than an edit to that file. Safe to re-run.
-- ============================================================

update public.webinars
   set kit_tag = 'spring-calc'
 where slug = 'spring-load-calculator';
