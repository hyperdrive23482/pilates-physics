-- ============================================================
-- Pilates Physics: Blog draft seed — "Progressive overload in Pilates"
--
-- Long-form version of the 20-slide Instagram carousel in
-- docs/social/progressive-overload-remo-carousel.md. Thesis is unchanged:
-- Pilates progresses, we just have no standard notation for it, so the
-- progress is unwritten rather than missing. Ends on Remo. Native post,
-- so canonical_url stays null.
--
-- Two things the post adds that the carousel had no room for:
--   1. A "which job is the load doing" section, because a piece about
--      progressive overload with the intent left off is the exact
--      contradiction docs/marketing/objections-and-empathy.md warns about
--      ("strength is a thing, never the thing").
--   2. The three bars any answer has to clear, which turns the abandoned
--      notetaking slides into a spec instead of a complaint.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for a featured image and publishing. Safe to re-run: ON CONFLICT
-- (slug) DO NOTHING means a second push is a no-op and will never
-- clobber edits made in the admin editor.
--
-- BEFORE PUBLISHING, in the admin editor:
--   1. Add a featured image plus alt text. The teaching photo from the
--      Canva carousel build works here. Recommended ~1600x900, under
--      500 KB. Note the carousel file flags client consent as unresolved
--      because the client's face is identifiable, so clear that first or
--      use a recrop.
--   2. Optional internal link: once 'personalization-in-pilates' (seed
--      052) is published, the "progress is unwritten" section is the
--      natural place to point at it, since that post frames the same
--      split as problem one and problem two. It is left out of the body
--      on purpose because linking a draft would 404.
--   3. Check that 'a-spring-is-not-one-weight' is actually published. Seed
--      029 inserted it as a draft, and the body links to it twice-removed
--      from the spring bullet. If it is still a draft, either publish it
--      or drop that link, because a draft link 404s for readers. (Seed
--      052 has the same link, so this may already be resolved.)
--   4. Set status to Published. Leave "Published at" blank to use now.
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'progressive-overload-in-pilates',
  'Progressive overload in Pilates: the progress is unwritten, not missing',
  $excerpt$Progressive overload is the term that decides whether Pilates gets taken seriously as strength work, and it is where the conversation always stops. Not because Pilates fails the test. Because we have no standard way to write down what we did.$excerpt$,
  $body$Somebody asks you whether Pilates counts as strength training. Maybe it is a client comparing it to the three days a week they spend lifting. Maybe it is a coach. Maybe it is the fitness internet, loudly.

You know the answer is yes, under the right intent, and you could defend it. But you also know how the argument goes next, because there is one term waiting at the end of it.

Progressive overload.

That is the phrase that decides whether something gets taken seriously as strength work, and it is where the conversation usually stops. Not because Pilates fails the test. Because we have no standard way to show our work.

So I want to put the emphasis somewhere else in that phrase. Progressive.

### We talk about progress constantly

Stand in any studio for a day and listen for it. Progress comes up all the time.

"You look stronger." A client finally nails teaser after eight months of almost. Someone mentions their back has not bothered them since spring. A regular gets through a class you would not have given them in January.

All of that is real, and you are not imagining it. You watched it happen.

Now answer a different question about the same client. What did they do last session, and what specifically makes today harder?

Most of us answer that in the moment. You read how they are moving that day, you remember roughly where you left off, you factor in what you are excited to teach them next, and you build the hour on the spot. That is a genuine skill. It is a good part of what separates a teacher fifteen years in from one in their first month.

It just leaves no trail.

### Why progressive overload became the word that gatekeeps

Strength training has an easy answer to that question, and the reason is not that it is better teaching. It is that it is writable.

Load, sets, reps. Three numbers in a row. 135 last week, 145 today. Nobody has to interpret it, nobody has to have been in the room, and the whole history of a lift fits in a notes app.

Pilates progresses too. It just progresses along more dimensions than a number line.

- The spring changes. And [a spring is not one weight](/blog/a-spring-is-not-one-weight) to begin with, so "one red" is not a value the way 145 pounds is a value. It depends on where the carriage is, and on the body on it. You can [run two bodies through the spring calculator](/spring-calculator) and watch the same setting come out as two different exercises.
- A modification comes off. The prop goes away, the hands come off the frame, the wall stops being there.
- The lever gets longer. Footbar down, box on, one leg instead of two.
- Range opens up, tempo slows down, the pause at the hardest point gets held a beat longer.
- Two things get stacked that you used to teach separately, which is its own kind of [class building](/blog/the-pilates-class-algorithm).

Every one of those is a progression, and several of them are overload in the strict sense. But you cannot write them in a column and have them mean the same thing to the next teacher, or to yourself in six weeks.

We have the progress. We do not have the notation.

### Progress is not missing, it is unwritten

I keep coming back to that sentence, because it changes which problem we are solving.

If Pilates genuinely did not progress people, that would be a teaching problem, and the fix would be education. That is not what is happening. You are progressing people. The failure is at the recording step, which is a different problem with a different fix, and it is worth being precise about that before anyone accepts a critique they did not earn.

Unwritten progress also has a cost, and it does not land on the argument. It lands on your client.

A runner gets a pace chart. Someone lifting gets a log with their numbers climbing. On the month they are sitting with a bank statement deciding what to cut, that log argues on their behalf.

Your client gets a good feeling and a see you next week. The closest our industry has come to a number is [the metric Whoop built with solidcore](/blog/whoop-x-solidcore-smart-innovation-or-marketing-hype), and I had real reservations about that one. So the value of a year of your work rests entirely on how they happen to feel the week that decision gets made. [Retention is the number that decides whether a studio lasts](/blog/unlocking-pilates-studio-business-success), and it sits downstream of whether anyone can see what they are getting.

Unwritten progress is the kind your client never gets to see.

### Before you add load, name the job it is doing

One caution, because this is where a conversation about overload tends to drag people somewhere they did not mean to go.

Load moves for two different reasons, and they point in opposite directions.

When the intent is strength, load has to climb. That is what progressive overload means, and in practice it means a setting genuinely harder than last time, in a step they can actually take.

When the intent is a skill, so articulation, connection, coordination, awareness, load is there to make the movement findable. That often means more support, not less. [Easier does not mean they are doing it wrong](/blog/just-because-it-is-easy-doesn-t-mean-they-re-doing-it-wrong).

One dial, two reasons to touch it. Both are progress. But a progression with no intent attached is just a different spring, and it is the reason "use the correct load, not the maximum load" and "load has to go up over time" sound like they contradict each other. They do not. They are answers to two different questions.

This is why I teach [what the load is actually doing on a reformer](/how-a-reformer-works) before I teach anyone what to change. Decide the intent first and the setting mostly answers itself, even on a body you have never taught before.

So when you write the progression down, write down which job it was doing. Which brings us to the part where nobody writes anything down.

### Every notetaking method gets abandoned for the same reason

Ask a teacher who has been at this for a decade what they have tried and you get an archaeology of abandoned systems. Pen and paper in a binder. A spreadsheet that was beautiful for three weeks. A doc per client. That little text box in the scheduling software.

They all got abandoned, and not for lack of discipline. There is no time and no energy left after a day of teaching. You finished six sessions, your hands were on people for all of them, and you are not sitting down for another forty minutes to reconstruct each one from memory. During the hour you cannot write either, because you are watching a carriage and you are holding onto somebody.

That is the actual bind, and it is worth saying plainly. You notice the improvements. You are just not built to store them long term and produce them on demand, and no system that asks for more of your evening is going to survive the month.

### What an answer would have to clear

Three bars, in this order, because they are the three reasons every previous attempt died.

1. **It cannot cost you time during the session.** You are teaching. Your attention is the product.
2. **It cannot cost you time after the session.** That is the energy that does not exist.
3. **It has to come back out in a form your client can look at.** Otherwise you have a private archive, not evidence.

Miss any one of those and you have invented another abandoned method.

### That is why I built Remo

[Remo](https://remopilates.com) listens while you teach and turns the session into notes. The exercise list, a muscle heat map, a spinal motion chart, from one click.

You teach the session the way you already teach it. The notes are waiting when you are done.

Then the part that was never really possible before: six weeks on one page. Exercise difficulty, what your client told you, what you observed, laid out over time. That is the trail. It is what you hand a client so they can see the distance between where they started and where they are now, and it is what you look at on a morning when you cannot remember whether you took the support away in March or in May.

No late-night report writing. There is a seven day free trial at [RemoPilates.com](https://remopilates.com).

What it is not: it does not decide what your client should do next. That call is yours, and it is the part you trained for. It just means you make it with better information than your memory of a Tuesday three weeks ago.

### Back to the question

Is Pilates strength training?

When that is the intent and the load climbs on purpose, yes. The reason the answer has never quite landed is not that we are wrong about it. It is that we have been arguing from memory.

Write it down and you do not have to argue. You can just show them.

What was your last abandoned notetaking method, and what made you stop?$body$,
  'draft'
)
on conflict (slug) do nothing;
