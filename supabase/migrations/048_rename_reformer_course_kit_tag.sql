-- ============================================================
-- Move the reformer course Kit tag from MOR-purchased to HARW-purchased.
--
-- The Kit tags were renamed in place on 2026-09-08 (MOR was the original
-- working title, The Making of a Reformer). provisionPurchase resolves the
-- tag by name and throws if it does not exist, so this column and the Kit
-- tag have to change together. 045 now seeds HARW-purchased directly; this
-- catches any database where the old 045 or 047 already ran. No-op elsewhere.
-- ============================================================

update public.webinars
set kit_tag = 'HARW-purchased'
where slug = 'how-a-reformer-works'
  and kit_tag = 'MOR-purchased';
