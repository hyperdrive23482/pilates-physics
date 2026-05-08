-- ============================================================
-- Pilates Physics: Email preview text
--
-- Adds the inbox preview snippet (also known as preheader text) to
-- content_pieces and the versioned content_drafts so each draft can
-- carry its own preview line.
-- ============================================================

alter table public.content_pieces
  add column if not exists email_preview_text text;

alter table public.content_drafts
  add column if not exists email_preview_text text;
