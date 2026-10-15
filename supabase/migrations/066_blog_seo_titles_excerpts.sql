-- ============================================================
-- Pilates Physics: bring blog titles and excerpts into Google's display range
--
-- The SEO audit (api/_lib/seo/rules.js) flagged published posts whose
-- <title> runs past 60 characters once " | Pilates Physics" is appended, or
-- whose description (the excerpt) falls outside 70 to 160 characters. Part 2
-- of "What Makes a Great Pilates Class?" also shared its excerpt with Part 1.
--
-- Titles are shortened, not rewritten: the post's h1 is its title, so each
-- new one keeps the original's words and voice. Excerpts are written from
-- each post's opening paragraphs.
--
-- Every update is guarded on the current value, so a title or excerpt
-- already edited in the admin editor is left alone. Safe to re-run.
--
-- Also: the momentum post links to /blog/progressive-overload-in-pilates,
-- which is still a draft (seed 055), so the link 404s. The link is unwrapped
-- to plain text unless that post has been published by the time this runs.
-- Re-add the link in the admin editor when it goes live.
-- ============================================================

update public.blog_posts
   set title = 'I measured Balanced Body''s Duro springs'
 where slug = 'balanced-body-duro-springs-measured'
   and title = 'I measured Balanced Body''s new Duro springs';

update public.blog_posts
   set excerpt = 'A studio owner sent me a set of Balanced Body''s new Duro springs, so I measured them. Three of four colors landed near the published values. The green did not.'
 where slug = 'balanced-body-duro-springs-measured'
   and excerpt = 'A studio owner sent me a set of Balanced Body''s new Duro springs, so I measured them. Three of the four colors landed close to the published values. The green did not.';

update public.blog_posts
   set excerpt = 'A red spring on one reformer is not a red spring on another, and no spring is a single weight. Six brands compared, and why matching them is hard.'
 where slug = 'comparing-springs-across-brands'
   and excerpt = 'A red spring on one reformer is not the same as a red spring on another, and no spring is a single weight to begin with. A look at six brands, and why matching them is harder than it sounds.';

update public.blog_posts
   set title = 'Does friction make the reformer harder?'
 where slug = 'does-friction-make-reformer-exercises-harder'
   and title = 'Does friction make reformer exercises harder?';

update public.blog_posts
   set title = 'What Good Hands-On Cueing Looks Like'
 where slug = 'good-hands-on-cueing'
   and title = 'What Good Hands-On Cueing Actually Looks Like';

update public.blog_posts
   set excerpt = 'A guide to using touch effectively in the Pilates studio: when consent matters, why verbal cues come first, and how to know when to move on.'
 where slug = 'good-hands-on-cueing'
   and excerpt = 'A guide to using touch effectively in the Pilates studio — when consent matters, why verbal cues come first, and how to know when to move on.';

update public.blog_posts
   set title = 'Easy Doesn''t Mean They''re Doing It Wrong'
 where slug = 'just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong'
   and title = 'Just Because It Is Easy Doesn''t Mean They''re Doing It Wrong';

update public.blog_posts
   set excerpt = 'The Pilates snob reflex that treats an easy exercise as a wrong one needs to end. What students on r/pilates are actually telling us about effort and form.'
 where slug = 'just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong'
   and excerpt = 'Why this age old Pilates snob response must end';

update public.blog_posts
   set excerpt = 'How the Lean Startup method applies to teaching movement: plan the class, watch what actually happens in front of you, and adapt instead of running the script.'
 where slug = 'lean-pilates-it-s-not-what-you-think'
   and excerpt = 'How The Lean Startup Method Applies to Teaching Movement';

update public.blog_posts
   set title = 'Technogym Launches the Reform Reformer'
 where slug = 'pilates-goes-mainstream-technogym-launches-the-reform-reformer'
   and title = 'Pilates Goes Mainstream: Technogym Launches the Reform Reformer';

update public.blog_posts
   set excerpt = 'The gym equipment giant jumps on the Pilates hype train with an app-connected reformer. What it means for studios, and what mainstream Pilates is still missing.'
 where slug = 'pilates-goes-mainstream-technogym-launches-the-reform-reformer'
   and excerpt = 'The gym equipment giant jumps on the hype train';

update public.blog_posts
   set title = 'Pilates Taught Me to Breathe Differently'
 where slug = 'pilates-taught-me-to-breathe-differently-and-it-changed-everything'
   and title = 'Pilates Taught Me to Breathe Differently—And It Changed Everything';

update public.blog_posts
   set excerpt = 'The science of Pilates breathing and how intentional breath elevates your practice, starting with a lesson from my mentor Amanda in Athens, Georgia.'
 where slug = 'pilates-taught-me-to-breathe-differently-and-it-changed-everything'
   and excerpt = 'The Science of Pilates Breathing and How It Can Elevate Your Practice';

update public.blog_posts
   set title = 'Does Faster Mean Easier on the Reformer?'
 where slug = 'reformer-momentum-slow-vs-fast'
   and title = 'Does Moving Faster on the Reformer Make Pilates Easier? The Physics of Momentum';

update public.blog_posts
   set title = 'Slow Is Smooth and Smooth Is Fast'
 where slug = 'slow-is-smooth-and-smooth-is-fast-pilates-edition'
   and title = 'Slow Is Smooth and Smooth Is Fast (Pilates Edition)';

update public.blog_posts
   set excerpt = 'How slowing down movement in Pilates helps students notice how they move, learn faster, and get more from each exercise than simply checking it off.'
 where slug = 'slow-is-smooth-and-smooth-is-fast-pilates-edition'
   and excerpt = 'How slowing down movement in Pilates helps students learn faster';

update public.blog_posts
   set excerpt = 'How to engineer a seamless, effective class flow: a three-part framework for a 45-minute all-levels reformer class, with checks and balances built in.'
 where slug = 'the-pilates-class-algorithm'
   and excerpt = 'How to engineer a seamless and effective class flow';

update public.blog_posts
   set title = 'The Pilates Instructor Feedback Loop'
 where slug = 'the-pilates-instructor-feedback-loop-a-process-for-cueing-successfully'
   and title = 'The Pilates Instructor Feedback Loop: A Process for Cueing Successfully';

update public.blog_posts
   set excerpt = 'Observe, decide, cue, repeat. A six-step process for cueing successfully, and the skill that separates a good Pilates instructor from a great one.'
 where slug = 'the-pilates-instructor-feedback-loop-a-process-for-cueing-successfully'
   and excerpt = 'Get your students moving confidently with these 6 steps';

update public.blog_posts
   set title = 'Turning First-Timers into Lifers'
 where slug = 'turning-first-timers-into-lifers'
   and title = 'Turning First-Timers into Lifers: How to Nail Your Intro Pilates Class';

update public.blog_posts
   set excerpt = 'Lessons from three intro reformer classes at the Y: set expectations from the first hello, manage mixed-ability beginners, and design a class they come back to.'
 where slug = 'turning-first-timers-into-lifers'
   and excerpt = 'What I learned teaching three intro reformer classes at the Y — how to set expectations from the first hello, manage mixed-ability beginners, and design a first class that gets them to come back.';

update public.blog_posts
   set excerpt = 'The key metrics every studio owner should know. Find, enroll, retain: the simple formula behind the most consistent boutique studios, and how to start using it.'
 where slug = 'unlocking-pilates-studio-business-success'
   and excerpt = 'The Key Metrics Every Studio Owner Should Know';

update public.blog_posts
   set title = 'What We Get Wrong About Tech in Pilates'
 where slug = 'what-everyone-gets-wrong-about-tech-in-pilates'
   and title = 'What Everyone Gets Wrong About Tech in Pilates';

update public.blog_posts
   set excerpt = 'Form isn''t the star of the show, it''s the cherry on top. Why spring settings and equipment setup matter more than a perfectly placed pinky toe.'
 where slug = 'what-everyone-gets-wrong-about-tech-in-pilates'
   and excerpt = 'Hint: Form isn''t the star of the show, it''s the cherry on top';

update public.blog_posts
   set excerpt = 'Part two of measuring A Great Class: student goals, how to track them alongside Pilates Principles, and what happens to a class that leans too far either way.'
 where slug = 'what-makes-a-great-pilates-class-part-2'
   and excerpt = 'Analyzing measurable class components to deliver stellar classes every time';

update public.blog_posts
   set excerpt = 'Breaking down the ''magic'' of Pilates: the mental, educational and physiological components that make the method work when it is taught well.'
 where slug = 'what-makes-pilates-so-effective'
   and excerpt = 'Breaking Down the "Magic" of Pilates';

update public.blog_posts
   set title = 'Whoop x [solidcore]: Innovation or Hype?'
 where slug = 'whoop-x-solidcore-smart-innovation-or-marketing-hype'
   and title = 'Whoop x [solidcore]: Smart Innovation or Marketing Hype?';

update public.blog_posts
   set excerpt = 'The good and the bad of a Whoop-developed, Pilates-specific metric, and why most fitness trackers miss what a reformer session actually does.'
 where slug = 'whoop-x-solidcore-smart-innovation-or-marketing-hype'
   and excerpt = 'The good and the bad of a Whoop developed Pilates-specific metric';

-- Dead link in the momentum post, see header.
update public.blog_posts
   set body_markdown = replace(
         body_markdown,
         '[progressive overload in Pilates](/blog/progressive-overload-in-pilates)',
         'progressive overload in Pilates'
       ),
       body_html = replace(
         body_html,
         '<a href="/blog/progressive-overload-in-pilates">progressive overload in Pilates</a>',
         'progressive overload in Pilates'
       )
 where slug = 'reformer-momentum-slow-vs-fast'
   and not exists (
     select 1 from public.blog_posts
      where slug = 'progressive-overload-in-pilates' and status = 'published'
   );
