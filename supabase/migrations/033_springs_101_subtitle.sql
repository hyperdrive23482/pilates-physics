-- ============================================================
-- Pilates Physics: Springs 101 subtitle refresh
-- Updates the portal header subtitle rendered from webinars.subtitle
-- (WorkshopPortal reads workshop.subtitle). Body prose lives in the
-- Springs101 React component; only the DB-driven subtitle changes here.
-- ============================================================

update public.webinars
  set subtitle = 'The physics of Pilates springs, from one Pilates instructor to another'
  where slug = 'springs-101';
