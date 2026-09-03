-- ============================================================
-- Pilates Physics: make the reorder function grants actually bite
--
-- Migration 044 ended with:
--   revoke execute on function public.reorder_course_modules(...) from anon;
--
-- That statement runs without error and has no effect. PostgreSQL grants
-- EXECUTE on a new function to PUBLIC by default, and revoking from one role
-- does not remove the PUBLIC grant it inherits. Confirmed against dev: an
-- anon-key POST to /rest/v1/rpc/reorder_course_modules reached the function
-- body and came back with the is_admin() guard's own error rather than a
-- permission denial.
--
-- Nothing was exposed by this. The guard inside each function is the real
-- control and it worked. But a revoke that reads as protection and provides
-- none is worse than no revoke at all, so this makes it true: PUBLIC loses
-- execute, authenticated gets it back, and the guard still decides.
--
-- After this, anon gets a 403 at the door and a signed-in non-admin gets the
-- guard's "admin only".
-- ============================================================

revoke execute on function public.reorder_course_modules(uuid, uuid[]) from public;
revoke execute on function public.reorder_quiz_questions(uuid, uuid[]) from public;

-- Guarded so the file still applies on a plain PostgreSQL used for local
-- validation, where Supabase's roles do not exist. Same reason 044 guards its
-- anon revoke.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.reorder_course_modules(uuid, uuid[]) to authenticated;
    grant execute on function public.reorder_quiz_questions(uuid, uuid[]) to authenticated;
  end if;
end
$$;
