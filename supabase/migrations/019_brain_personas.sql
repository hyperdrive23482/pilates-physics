-- ============================================================
-- Pilates Physics: Personas as brain entries
--
-- Folds audience personas into the brain_entries table so they
-- can be edited/toggled from the same admin UI as style guides
-- and past posts. The standalone public.personas table from 014
-- was unused outside its own seed migration and is dropped here.
-- ============================================================

-- ---------- 1. Allow 'persona' as a brain entry type ------------
alter table public.brain_entries
  drop constraint if exists brain_entries_type_check;

alter table public.brain_entries
  add constraint brain_entries_type_check
    check (type in ('blog_post', 'transcript', 'style_guide', 'persona'));

-- ---------- 2. Seed the 4 personas ------------------------------
insert into public.brain_entries (type, title, content, is_active, token_estimate)
values
  ('persona', 'Amanda — The Vocal Enthusiast',
$persona$**Role:** Pilates enthusiast (not an instructor).

**Background:** Well-educated. Does Pilates every day. Has felt it change her body and reduce her pain.

**Relationship to the work:** Loves posts on using physics to individualize Pilates programming.

**Posture:** Vocal. Often criticizes people who say Pilates isn't strength training, because that isn't her lived experience.$persona$,
   true, 110),
  ('persona', 'Cody — The Even-Keeled Analyst',
$persona$**Role:** Pilates instructor and crossfitter. Teaches anatomy of Pilates to instructors.

**Background:** Masters in Exercise Physiology. Believes in progressive overload. Recognizes that Pilates can't and isn't designed to work the same way as strength training.

**Relationship to the work:** Loves posts on Pilates physics — the math lens complements her even-keeled analysis of the method.

**Posture:** Engages technically. Doesn't get defensive about Pilates not being something it isn't.$persona$,
   true, 130),
  ('persona', 'Karen — The Opinionated Classicist',
$persona$**Role:** Classical Pilates instructor.

**Background:** Not great with math. No training in exercise physiology beyond the anatomical material from her Pilates training — material that sub-optimizes and ignores scientific principles, leaving it only about 50% right in most situations.

**Relationship to the work:** Likes the posts that confirm her preconceived notions best. On the others, she finds edge cases or caveats that are exceptions to the conclusion, or that appear to discredit it.

**Posture:** Opinionated. Often says "Well, if they studied REAL Pilates the results would be different."$persona$,
   true, 150),
  ('persona', 'Stephanie — The Open-Minded Learner',
$persona$**Role:** Pilates instructor with 2 years of part-time teaching experience. Works with private and group classes.

**Background:** Learned choreography through her reformer teacher training. Doesn't have formal training in all the other things that matter to leading a fitness session. No formal training in fitness science, exercise physiology, or personal training. Picked her teacher training program because it was convenient, not because she had vast knowledge of all the options out there.

**Relationship to the work:** Wants to keep learning and getting better.

**Posture:** Open-minded.$persona$,
   true, 170)
on conflict (type, title) do update set
  content = excluded.content,
  is_active = excluded.is_active,
  token_estimate = excluded.token_estimate;

-- ---------- 3. Drop the orphan personas table -------------------
drop trigger if exists tg_personas_updated_at on public.personas;
drop table if exists public.personas cascade;
