-- ============================================================
-- Pilates Physics: Blog excerpt persistence
--
-- Claude already produces `blog_excerpt` in submit_content, but
-- there was nowhere to store it between generation and the public
-- blog_posts row. Adds excerpt to content_pieces (denormalized
-- latest) and content_drafts (versioned history), mirroring the
-- email_preview_text pattern in migration 013.
-- ============================================================

alter table public.content_pieces
  add column if not exists excerpt text;

alter table public.content_drafts
  add column if not exists excerpt text;
