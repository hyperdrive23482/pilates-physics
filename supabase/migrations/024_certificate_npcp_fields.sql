-- ============================================================
-- Pilates Physics: NPCP fields on workshops for certificates
-- Run this in Supabase SQL Editor
-- ============================================================

alter table public.webinars
  add column if not exists npcp_cecs numeric(4,1),
  add column if not exists npcp_course_id text,
  add column if not exists npcp_approval_date date;
