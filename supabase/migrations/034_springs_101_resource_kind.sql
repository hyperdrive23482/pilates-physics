-- ============================================================
-- Pilates Physics: add a 'resource' content kind
-- Adds a third webinars.kind alongside 'webinar' (workshops) and
-- 'tool' (interactive tools). Resources are portal reading material
-- that render through ToolHost like tools, but get their own
-- dashboard section. Springs 101 becomes the first resource.
--
-- Public workshop listings are keyed to kind = 'webinar', so a
-- resource stays out of the education/catalog pages automatically.
-- ============================================================

alter table public.webinars drop constraint if exists webinars_kind_check;
alter table public.webinars
  add constraint webinars_kind_check
  check (kind in ('webinar', 'tool', 'resource'));

update public.webinars set kind = 'resource' where slug = 'springs-101';
