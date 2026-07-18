-- ============================================================
-- Pilates Physics: Springs 101 primer title refresh
-- Renames the primer to something more descriptive and less
-- intimidating. Drives the portal page H1 (WorkshopPortal reads
-- webinars.title) and the dashboard card.
-- ============================================================

update public.webinars
  set title = 'Pilates Springs 101: A Primer'
  where slug = 'springs-101';
