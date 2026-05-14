-- ============================================================
-- Pilates Physics: Per-piece Kit broadcast tag targeting
--
-- Stores an optional list of Kit tag IDs plus an any/all match mode
-- on each content_piece. Empty kit_tag_ids = send to all subscribers
-- (unchanged default behavior).
-- ============================================================

alter table public.content_pieces
  add column kit_tag_ids jsonb not null default '[]'::jsonb,
  add column kit_tag_match text not null default 'any'
    check (kit_tag_match in ('any', 'all'));
