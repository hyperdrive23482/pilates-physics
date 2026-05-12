-- ============================================================
-- Pilates Physics: Content Seed — Structured data
--
-- Seeds:
--   personas       (4 rows)
--   glossary_terms (1 row)
--   brain_entries  (1 row: voice & tone style guide)
--   content_ideas  (topic backlog + newsletter backlog + parking lot)
--
-- Idempotent: ON CONFLICT (slug/type+title) DO UPDATE for unique
-- tables; CTE + WHERE NOT EXISTS for content_ideas (no slug).
-- ============================================================

-- ---------- 1. Personas -----------------------------------------
insert into public.personas (slug, name, role, background, relationship_to_work, posture, sort_order)
values
  ('amanda', 'Amanda', 'Pilates enthusiast (not an instructor).',
    $$Well-educated. Does Pilates every day. Has felt it change her body and reduce her pain.$$,
    $$Loves posts on using physics to individualize Pilates programming.$$,
    $$Vocal. Often criticizes people who say Pilates isn't strength training, because that isn't her lived experience.$$,
    1),
  ('cody', 'Cody', 'Pilates instructor and crossfitter. Teaches anatomy of Pilates to instructors.',
    $$Masters in Exercise Physiology. Believes in progressive overload. Recognizes that Pilates can't and isn't designed to work the same way as strength training.$$,
    $$Loves posts on Pilates physics — the math lens complements her even-keeled analysis of the method.$$,
    $$Engages technically. Doesn't get defensive about Pilates not being something it isn't.$$,
    2),
  ('karen', 'Karen', 'Classical Pilates instructor.',
    $$Not great with math. No training in exercise physiology beyond the anatomical material from her Pilates training — material that sub-optimizes and ignores scientific principles, leaving it only about 50% right in most situations.$$,
    $$Likes the posts that confirm her preconceived notions best. On the others, she finds edge cases or caveats that are exceptions to the conclusion, or that appear to discredit it.$$,
    $$Opinionated. Often says "Well, if they studied REAL Pilates the results would be different."$$,
    3),
  ('stephanie', 'Stephanie', 'Pilates instructor with 2 years of part-time teaching experience. Works with private and group classes.',
    $$Learned choreography through her reformer teacher training. Doesn't have formal training in all the other things that matter to leading a fitness session. No formal training in fitness science, exercise physiology, or personal training. Picked her teacher training program because it was convenient, not because she had vast knowledge of all the options out there.$$,
    $$Wants to keep learning and getting better.$$,
    $$Open-minded.$$,
    4)
on conflict (slug) do update set
  name = excluded.name,
  role = excluded.role,
  background = excluded.background,
  relationship_to_work = excluded.relationship_to_work,
  posture = excluded.posture,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------- 2. Glossary terms -----------------------------------
insert into public.glossary_terms (slug, term, plain_definition, misconception, example, sort_order)
values
  ('balanced-body-spring-colors',
    'Balanced Body spring colors',
    $$Balanced Body reformer springs use a color code where green = heavy, red = medium, blue = medium-light, yellow = light. A typical 5-spring setup is two reds, a green, a blue, and a yellow.$$,
    $$People (and AI assistants) often assume red = heavy because red reads as "strong" in most other contexts. In Balanced Body's system, that's wrong. Heavy is green.$$,
    $$When walking through max-load math, I specify "five heavy (green) Balanced Body springs" so readers don't have to remember the color code. The "(green)" parenthetical does the disambiguation.$$,
    1)
on conflict (slug) do update set
  term = excluded.term,
  plain_definition = excluded.plain_definition,
  misconception = excluded.misconception,
  example = excluded.example,
  sort_order = excluded.sort_order,
  updated_at = now();

-- ---------- 3. Voice & Tone style guide (brain_entries) ---------
insert into public.brain_entries (type, title, content, source_url, is_active, token_estimate)
values
  ('style_guide', 'Voice & Tone Guide',
    $voice$# Voice & Tone Guide

How Kaleen writes and speaks across all content — blog posts, video scripts, Instagram captions, and longer-form educational material. Use this as the baseline for drafting anything in her voice.

---

## Overall Voice

Conversational authority. Write like you're explaining something to a smart friend over coffee — direct, warm, zero pretension, but clearly expert. Don't hedge excessively or use academic distance. Own opinions openly.

---

## Core Patterns

### 1. First person, always

Write as "I" — never the royal "we" or the detached third person. Share opinions openly and own stances without apology.

- ✅ "Here's my issue with that"
- ✅ "Personally, I don't care because..."
- ✅ "I think this is more of a cherry on top"
- ❌ "One might argue that..."
- ❌ "We as practitioners should consider..."

### 2. Real-world examples before theory

Almost every piece starts with a story or concrete scenario, then zooms out to the principle. Teach inductively — show first, explain second.

- The breathing post starts with Amanda and the Cadillac session
- The client feedback post starts with the two students who didn't come back
- The vibe coding post starts with a student asking for YouTube recommendations
- Spring videos start with a physical demo, then cut to the graph

### 3. Casual but precise

Use contractions, conversational interjections, and rhetorical questions freely. But when the technical substance arrives, be precise — name specific spring weights, cite actual studies, reference exact frameworks.

Casual delivery makes precision land harder.

- ✅ "Y'all, this video is going around..."
- ✅ "Boom! 15 seconds later she had an email..."
- ✅ "Let's dig in."
- ✅ "On a red and a blue spring for Balanced Body, that is about 37 pounds."
- ❌ Vague hand-waving like "springs are kind of heavy"
- ❌ Overly academic: "The biomechanical implications of spring-based resistance modalities..."

### 4. Frameworks and mental models

Give people a lens to think through, not just an answer. Build portable thinking tools they can apply on their own.

Examples from existing content:
- The Feedback Loop (6 steps for cueing)
- Supportive vs. Resistive spring behavior labels
- MVC / MVT (Minimum Viable Class / Minimum Viable Teacher)
- The Class Algorithm (warm-up, main, cool-down with checks)
- RPE as a class design tool

### 5. Inclusive and anti-gatekeeping

Consistently push back against snobbery and dogma. Validate people's experiences. Never position yourself as the only authority.

- ✅ "Just because someone says it isn't hard doesn't automatically mean they are doing it wrong."
- ✅ "Neither one of them is the standard."
- ✅ "I'm not 100% sure what that evolution looks like yet"
- ❌ "Any good instructor would know..."
- ❌ "If you're not doing X, you're doing it wrong"
- ❌ Taking sides in the classical vs. contemporary debate

### 6. Startup and engineering crossover

Naturally pull from engineering and startup experience — Lean methodology, build-measure-learn loops, MVPs, leading indicators, correlation vs. causation, systems thinking. This is one of the most distinctive qualities of the voice. Don't force it, but don't shy away from it either.

- ✅ "If we think of our classes as products and our students as customers..."
- ✅ "Correlation doesn't equal causation. Was the cue you used the game changer? Or was there something else?"
- ✅ "Nothing measured is nothing improved."

### 7. Sentence structure

Short declarative sentences mixed with longer explanatory ones. Use fragments for emphasis. Keep paragraphs short — rarely more than 3-4 sentences. Break complex ideas into numbered or bulleted lists.

- ✅ "Nope!"
- ✅ "That's this step."
- ✅ "That's okay."
- ✅ "Springs get heavier the more they're stretched, no matter what."

### 8. Emotional honesty without melodrama

Share real feelings but don't dwell. Be vulnerable enough to be relatable without making the reader feel like they need to comfort you. The tone is resilient.

- ✅ "That stung a little. But it also sparked a bigger reflection."
- ✅ "I broke down in tears" (stated matter-of-factly, then moves on)
- ❌ Extended emotional processing or self-pity

---

## Signature Phrases and Transitions

These appear naturally across content. Use them but don't overuse any single one.

- "Let's dig in" / "Let's dive in" — common openers
- Rhetorical questions as section transitions — "So what does this mean practically?"
- "Now..." — to pivot to a new angle
- "The reality is..." / "Here's the thing..."
- "So, why am I doing the math here?" — preemptively addressing why the detail matters
- Closing with a forward-looking invitation — "Stay tuned," "Drop it in the comments," "Let's chat"

---

## What Kaleen Never Does

- Never talks down to the reader
- Never uses jargon without explaining it
- Never tells someone they're wrong — reframes, offers a better model, or shows the math
- Never positions one Pilates lineage as superior to another
- Never uses fear ("you'll get injured if...") as a motivator
- Never calls out other instructors by name for doing something wrong
- Never makes someone feel bad for what they don't know

---

## Technical Language

Physics and biomechanics terms are used frequently but always explained on first use or with an intuitive analogy. Assume the audience is smart but not trained in engineering.

- ✅ "Springs get heavier the more they're stretched. And the best way to represent this visually is with a graph."
- ✅ "The horizontal force in this triangle is the weight of the springs."
- ✅ Describing lateral breathing as "an umbrella opening and closing"
- ❌ Assuming the audience knows what a K factor is without explanation
- ❌ Dropping physics equations without context

When referencing spring data, default to Balanced Body as the shared reference point since it's the most widely used brand in the audience.

---

## How Uncertainty Is Handled

Frame uncertainty with confidence — own not knowing rather than hedging weakly.

- ✅ "I'm not 100% sure what that evolution looks like yet, but I do know Lean Methodology is the way we'll get there."
- ✅ "It depends." (said directly, then explain what it depends on)
- ✅ "Would he design his equipment the same way today? Maybe. Maybe not."
- ❌ "It could possibly perhaps be the case that..."
- ❌ Pretending to have certainty you don't have

---

## Humor

Present but understated. Dry, self-aware, occasionally nerdy. Never sarcastic at anyone else's expense.

- ✅ "It's very high-tech." (about a piece of tape on the reformer)
- ✅ "a coding dumb-dumb like me"
- ✅ "before you start lowering all your pulleys..."
- ❌ Puns or forced jokes
- ❌ Making fun of other instructors or methods

---

## Video-Specific Voice Notes

- Opens with a hook question or bold statement: "Does body weight change the resistance of the springs?" / "Have you ever wondered what this second row of spring hooks is?"
- Speaks directly to camera — conversational, not scripted-sounding
- Uses physical demos as the anchor, then layers in the explanation
- References the Balanced Body graph frequently as a shared visual language
- Closes with an invitation: "Drop your questions in the comments" / "Let's chat"
- Comfortable saying "I don't know" or "it depends" — doesn't fake certainty
$voice$,
    null,
    true,
    null)
on conflict (type, title) do update set
  content = excluded.content,
  source_url = excluded.source_url,
  is_active = excluded.is_active;

-- ---------- 4. Content ideas ------------------------------------
-- Topic backlog + newsletter backlog + parking lot, all into one
-- table. Idempotency via WHERE NOT EXISTS on title.

with seed_ideas (title, notes, status, format, category, difficulty, newsletter_data) as (values

  -- ===== TOPIC BACKLOG: Springs & Resistance =====
  ('Can springs stretch too far?',
    $$Elastic vs. plastic deformation on a reformer. What does "worn out" actually look like mechanically? Ties to the spring wear video.$$,
    'open', 'reel', 'Springs & Resistance', null, null::jsonb),
  ('Chair springs',
    $$How do chair springs differ from reformer springs? Compression vs. extension, different force curves, different programming implications.$$,
    'open', 'reel', 'Springs & Resistance', null, null::jsonb),
  ('Spring noise',
    $$What causes it, does it mean anything is wrong, when should you worry?$$,
    'open', 'reel', 'Springs & Resistance', 'quick', null::jsonb),
  ('How does lowering the footbar affect load?',
    $$Changes geometry, angle of force application, and range of spring extension.$$,
    'open', 'reel', 'Springs & Resistance', null, null::jsonb),
  ($$"Heavier springs = harder" is wrong$$,
    $$Standalone myth-bust. Supportive vs. resistive is the better framework. Touched on across several videos but no dedicated piece.$$,
    'open', 'reel', 'Springs & Resistance', null, null::jsonb),
  ($$Why "same springs for everyone" doesn't work$$,
    $$Narrative version of the height/gear video, more opinion-driven.$$,
    'open', 'blog', 'Springs & Resistance', null, null::jsonb),
  ('Spring comparison across classical brands',
    $$Extension of the contemporary brand comparison video. Do classical reformer springs follow the same patterns?$$,
    'open', 'reel', 'Springs & Resistance', 'hard', null::jsonb),
  ($$What does "a light spring" actually mean?$$,
    $$The label is relative. A light spring for footwork is not the same as a light spring for arm work. Context matters.$$,
    'open', 'reel', 'Springs & Resistance', 'quick', null::jsonb),
  ('Pre-tensioning deep dive',
    $$When does pre-tensioning actually make a meaningful difference vs. when it's negligible? More data than the original video.$$,
    'open', 'reel', 'Springs & Resistance', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Forces & Body Position =====
  ('Body weight in plank',
    $$Angle matters: hands lower than feet and it's harder to support body weight with arms, but carriage doesn't want to press out as much. Multiple competing forces to unpack.$$,
    'open', 'reel', 'Forces & Body Position', 'hard', null::jsonb),
  ('Upper body strength in 3 variations of pike',
    $$Floor, platform, footbar. How does the surface height change what's demanded of the upper body?$$,
    'open', 'reel', 'Forces & Body Position', null, null::jsonb),
  ('Angular velocity',
    $$Short vs. tall person in leg lowers: speed feels different but why? Linear vs. angular velocity distinction.$$,
    'open', 'reel', 'Forces & Body Position', 'hard', null::jsonb),
  ('Standing on the reformer vs. on the floor: same exercise, different forces',
    $$Extends the standing vs. seated video into a broader principle.$$,
    'open', 'reel', 'Forces & Body Position', null, null::jsonb),
  ('What happens when you change one variable',
    $$Pick an exercise and change only one thing (spring, gear, strap length, body position) to show the cascade effect.$$,
    'open', 'reel', 'Forces & Body Position', null, null::jsonb),
  ('Moment arms in Pilates: why leverage is the real programming tool',
    $$Torque and lever arms as the unifying concept behind most of the spring/force videos. This could be the "grand unified theory" video.$$,
    'open', 'both', 'Forces & Body Position', 'hard', null::jsonb),
  ($$Gravity's role on the reformer$$,
    $$When does gravity help, when does it resist? Supine vs. prone vs. standing changes everything.$$,
    'open', 'reel', 'Forces & Body Position', null, null::jsonb),
  ('Why the same exercise feels different on different days',
    $$Fatigue, hydration, nervous system state, warm-up quality. Not everything is about springs.$$,
    'open', 'blog', 'Forces & Body Position', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Equipment Mechanics =====
  ($$Friction: the force everyone thinks matters but doesn't$$,
    $$Referenced in multiple videos; deserves its own standalone explainer. Wheels + bearings = negligible friction.$$,
    'open', 'reel', 'Equipment Mechanics', null, null::jsonb),
  ('The pulley as a force redirector, not a force multiplier',
    $$Clean foundational video. The rope tension rule, applied.$$,
    'open', 'reel', 'Equipment Mechanics', null, null::jsonb),
  ('Reformer setup as a teaching skill, not just a safety checklist',
    $$Reframe equipment setup as part of the craft of teaching.$$,
    'open', 'blog', 'Equipment Mechanics', null, null::jsonb),
  ('Footbar height: more than just comfort',
    $$How footbar position changes joint angles, range of motion, and load distribution.$$,
    'open', 'reel', 'Equipment Mechanics', null, null::jsonb),
  ('Headrest up vs. down: does it actually matter?',
    $$What changes biomechanically? When does it matter and when is it preference?$$,
    'open', 'reel', 'Equipment Mechanics', 'quick', null::jsonb),
  ('Why reformers feel different from brand to brand',
    $$Beyond springs: rail friction, carriage weight, pulley placement, rope stretch. The full picture.$$,
    'open', 'blog', 'Equipment Mechanics', null, null::jsonb),
  ('The geometry of the reformer frame',
    $$Why the fixed dimensions (frame length, spring bar to pulley distance) constrain everything else.$$,
    'open', 'reel', 'Equipment Mechanics', 'hard', null::jsonb),

  -- ===== TOPIC BACKLOG: Teaching Methodology =====
  ('Supportive vs. resistive cheat sheet',
    $$Follow-up to the framework video with a practical reference list of common exercises categorized.$$,
    'open', 'both', 'Teaching Methodology', null, null::jsonb),
  ('The progression gap in Pilates',
    $$How do you actually progress someone? Not just harder exercises, but smarter sequencing. Ties to the blog post.$$,
    'open', 'blog', 'Teaching Methodology', null, null::jsonb),
  ('When to cue and when to shut up',
    $$The art of letting people move. Ties to the feedback loop post.$$,
    'open', 'blog', 'Teaching Methodology', 'quick', null::jsonb),
  ($$How to teach someone who's "too strong" for your class$$,
    $$Practical strategies for scaling up within a group setting.$$,
    'open', 'blog', 'Teaching Methodology', null, null::jsonb),
  ($$How to teach someone who's struggling without singling them out$$,
    $$Group class management when one person needs more help.$$,
    'open', 'blog', 'Teaching Methodology', null, null::jsonb),
  ('The first 5 minutes matter most',
    $$How the warm-up sets the tone for the entire session.$$,
    'open', 'blog', 'Teaching Methodology', 'quick', null::jsonb),
  ('Teaching tempo as a tool',
    $$Slow vs. fast isn't just about difficulty. It's about learning stage, intent, and nervous system regulation. Ties to the Slow Is Smooth post.$$,
    'open', 'blog', 'Teaching Methodology', null, null::jsonb),
  ($$What "control" actually means in Pilates$$,
    $$It's not just "go slow." It's the ability to modulate speed, range, and force intentionally.$$,
    'open', 'both', 'Teaching Methodology', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Teacher Training & Industry =====
  ('Lean Pilates part 2',
    $$What would an actual MVP teacher training program look like? Curriculum proposal.$$,
    'open', 'blog', 'Teacher Training & Industry', 'hard', null::jsonb),
  ($$Sourcing reformer components during Pilates' lifetime$$,
    $$Where did the original parts come from? Historical deep dive.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),
  ('The instructor shortage is a training problem',
    $$Studios can't find good teachers because TT programs don't produce them.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),
  ($$Why continuing education doesn't fix bad foundations$$,
    $$CE is great, but if the base training missed teaching skills, more anatomy workshops won't help.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),
  ('Classical vs. contemporary: a false war',
    $$Without taking sides, explain why the debate misses the point. Physics doesn't care about lineage.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),
  ('What Pilates can learn from physical therapy',
    $$PT has evidence-based progression, outcome measurement, and feedback loops. Pilates could adopt some of this.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),
  ('What Pilates can learn from startups',
    $$Beyond Lean. Customer discovery, iteration speed, measuring what matters.$$,
    'open', 'blog', 'Teacher Training & Industry', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Science & Research =====
  ('Pilates deserves better science (part 2)',
    $$What would a well-designed Pilates study actually look like?$$,
    'open', 'blog', 'Science & Research', null, null::jsonb),
  ('Heart rate is the wrong metric for Pilates',
    $$Why calorie burn and HR don't capture what Pilates actually does. Ties to the "What Makes Pilates So Effective" post.$$,
    'open', 'both', 'Science & Research', null, null::jsonb),
  ('Breath as a performance tool, not just a cue',
    $$The Li et al. study and what it means for how we teach breathing.$$,
    'open', 'blog', 'Science & Research', null, null::jsonb),
  ('The conscious competence model applied to 3 different exercises',
    $$Take the framework from the Slow Is Smooth post and show it in action across beginner, intermediate, advanced movements.$$,
    'open', 'both', 'Science & Research', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Business & Studio Operations =====
  ('Studio metrics that actually matter',
    $$Simplified version of the BFS Network analysis for studio owners who don't speak startup.$$,
    'open', 'blog', 'Business & Studio Operations', null, null::jsonb),
  ('Why your best clients leave without telling you why',
    $$Silent churn and how to catch it before it happens. Ties to the client feedback post.$$,
    'open', 'blog', 'Business & Studio Operations', null, null::jsonb),
  ($$Pricing Pilates: why you're probably undercharging$$,
    $$The data on boutique fitness pricing and why Pilates has room to charge more.$$,
    'open', 'blog', 'Business & Studio Operations', 'quick', null::jsonb),
  ('The referral machine',
    $$44% of profitable studios say referrals are their best lead source. How to engineer that.$$,
    'open', 'blog', 'Business & Studio Operations', null, null::jsonb),

  -- ===== TOPIC BACKLOG: Tech & Innovation =====
  ('What Pilates tech should actually measure',
    $$Not form. Not calories. Spring load, progression, and teaching quality. Ties to multiple posts.$$,
    'open', 'blog', 'Tech & Innovation', null, null::jsonb),
  ('AI for Pilates instructors: practical use cases',
    $$Beyond the class analyzer. Session notes, homework, client communication.$$,
    'open', 'blog', 'Tech & Innovation', null, null::jsonb),
  ('Why form tracking misses the point',
    $$Standalone version of the argument from the "3 Reasons" and "What Everyone Gets Wrong" posts.$$,
    'open', 'reel', 'Tech & Innovation', null, null::jsonb),

  -- ===== NEWSLETTER BACKLOG: Ready to write =====
  ($$"Heavier springs = harder" is wrong (newsletter)$$,
    $$Supportive vs. resistive is the better framework.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Pick one exercise where adding a spring actually makes it easier; notice what changed.", "cta": "Hit reply with an exercise where the heavier spring made it easier.", "source": "topic-backlog.md"}$$::jsonb),
  ($$What does "a light spring" actually mean? (newsletter)$$,
    $$The label is relative to the exercise, not the equipment.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Take the same \"light\" spring through footwork and arm work; notice the difference in load.", "cta": "Hit reply with what you tell clients when they ask for \"lighter.\"", "source": "topic-backlog.md"}$$::jsonb),
  ('The first 5 minutes matter most (newsletter)',
    $$How the warm-up sets the tone for the entire session.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "In your next class, pay attention to what you cue in the first 5 minutes vs. the rest.", "cta": "Hit reply with what your warm-up actually establishes.", "source": "topic-backlog.md"}$$::jsonb),
  ('When to cue and when to shut up (newsletter)',
    $$The art of letting people move.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "Pick one client this week and intentionally cue half as much.", "cta": "Link to the Feedback Loop blog post.", "source": "topic-backlog.md"}$$::jsonb),
  ($$Spring noise — what it means and what it doesn't (newsletter)$$,
    $$Most spring noise is normal. Some isn't.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Next time you hear a noise, identify the source before assuming the spring is broken.", "cta": "Hit reply if you have a noise you can't diagnose.", "source": "topic-backlog.md"}$$::jsonb),
  ('Headrest up vs. down — does it actually matter? (newsletter)',
    $$When it changes the exercise and when it's preference.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Run one exercise both ways, notice what shifts in the cervical spine and shoulders.", "cta": "Hit reply with where you land.", "source": "topic-backlog.md"}$$::jsonb),
  ('Why Pilates beginners progress so fast (and then plateau)',
    $$Beginners progress quickly because the bar for failure is low enough that Pilates clears it; once they get stronger, it stops clearing it. Single observation that explains both phases.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "When a long-time client plateaus, notice whether they're still hitting failure in any exercise — and whether that's the goal you set for them.", "cta": "Hit reply with a client whose progression has stalled.", "source": "parking-lot.md"}$$::jsonb),
  ($$Body weight doesn't change spring tension (but it changes the workout)$$,
    $$The wheels eliminate friction, so body weight doesn't affect spring force directly. But body weight still shows up in plank-style exercises through other mechanics.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "In your next class, put two clearly different-weight clients on the same springs in footwork, then in plank. Notice where body weight does and doesn't matter.", "cta": "Hit reply with the exercise where body weight matters most in your teaching.", "source": "video-transcripts.md (Spring Series Part 5)"}$$::jsonb),
  ('Standing changes the carriage travel — and the spring weight',
    $$When you stand, the carriage moves twice as far per inch of arm motion (basic pulley rule). The same arm path on the same spring delivers a different load standing vs. seated.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "In your next class, run the same exercise both ways. Notice what each demands.", "cta": "Hit reply with an exercise you'd never thought to compare across the two positions.", "source": "video-transcripts.md (Standing vs. Seated)"}$$::jsonb),
  ($$Rope angle doesn't change spring tension — but it changes what your body has to do$$,
    $$Pulley rule: rope tension is the same regardless of angle. But the horizontal and vertical components of that force shift based on body position, which changes what you're pushing vs. lifting.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "In your next class, do the same exercise (e.g., serve-a-tray) seated and high kneeling on a single blue. Notice where the demand lands.", "cta": "Hit reply with how this changes how you'd cue.", "source": "video-transcripts.md (Rope Angle)"}$$::jsonb),
  ('Do Pilates springs actually wear out?',
    $$Yes, but gradually. Hooke's Law applies inside the elastic range; once you cross into plastic deformation, the spring is permanently changed. Manufacturers' 1–2 year guideline is a safety recommendation, not a sales tactic.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Look at the springs in your studio. Any older than 2 years in heavy daily use?", "cta": "Hit reply if you've ever caught a worn-out spring before it broke.", "source": "video-transcripts.md (Do Pilates Springs Wear Out?)"}$$::jsonb),
  ('Lowering the foot bar vs. gearing out: same load, different geometry',
    $$Both options reduce spring extension by similar amounts for tall clients. But the joint angles differ between the two — and rope length stays put if you adjust the foot bar.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "The next time you accommodate a tall client in footwork, try both methods on consecutive classes and notice which one preserves the rest of your flow.", "cta": "Hit reply with which one you reach for first.", "source": "video-transcripts.md (Footbar vs. Gearbar Adjustment)"}$$::jsonb),
  ('Springs only pull. They never push.',
    $$Single myth-bust. The "push" feeling is just body orientation relative to the direction the spring is pulling. Same with weights — gravity only pulls.$$,
    'open', 'newsletter', null, 'quick',
    $${"try_this": "Pick an exercise that \"feels like pushing\" and identify which direction the spring is actually pulling from.", "cta": "Hit reply with an exercise that confused you on this.", "source": "video-transcripts.md (Pilates Springs Don't Push AND Pull)"}$$::jsonb),
  ($$Why a heavier client's bridge is harder than a lighter client's$$,
    $$In a bridge, body weight pushes the carriage down and out — about half your body weight goes into that horizontal force. A 250 lb client deals with ~125 lbs pushing the carriage out vs. ~60 lbs for a 120 lb client. Same springs. Different workout.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "In your next bridge sequence, offer different springs to clients of clearly different body weights and see how it lands.", "cta": "Hit reply with how you currently scale bridges across body sizes.", "source": "video-transcripts.md (Load in a Bridge)"}$$::jsonb),
  ($$Why pressing the carriage out in a bridge doesn't feel harder$$,
    $$As the carriage moves out, torque on the knee increases (more horizontal shin angle) — but Hooke's Law also makes the springs heavier, which is supportive in a bridge. The two effects cancel out. Strikingly, swap the springs for a kettlebell weight stack and the cancel-out is gone.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "Ask a student bridging at full extension whether it feels heavier or the same as closed.", "cta": "Hit reply with what they said.", "source": "video-transcripts.md (Bridge Press Out)"}$$::jsonb),
  ('Gratz reformer springs are basically Balanced Body red springs',
    $$When you measure them, the spring profiles match almost exactly. So the Gratz feel isn't the springs — it's the system: frame, wheels, ropes, design choices.$$,
    'open', 'newsletter', null, null,
    $${"try_this": "If you teach on both, notice everything that's different other than the springs.", "cta": "Hit reply with where you've felt the system difference most.", "source": "video-transcripts.md (Gratz vs. BB)"}$$::jsonb),

  -- ===== NEWSLETTER BACKLOG: Drafting / written =====
  ($$The spring at the start isn't the spring at the end (Hooke's Law)$$,
    $$Source draft: content/drafts/wt-vs-pilates.md. Newsletter rendered to content/newsletters/wt-vs-pilates-newsletter.md (status: draft, awaiting send). Note: draft contains additional concepts (load profile, max load, progression) that did not make this newsletter's scope.$$,
    'selected', 'newsletter', null, null,
    $${"try_this": null, "cta": null, "source": "content/drafts/wt-vs-pilates.md"}$$::jsonb),

  -- ===== NEWSLETTER BACKLOG: Ideas / not yet evaluated =====
  ('Why the same exercise feels different on different days (newsletter angle)',
    $$Fatigue, hydration, nervous system state.$$,
    'open', 'newsletter', null, null,
    $${"source": "topic-backlog.md", "evaluated": false}$$::jsonb),
  ('Pre-tensioning — when it actually matters',
    $$The second hook row shifts the working range slightly. Mostly negligible except on very light springs. Could narrow to "the second row of hooks: when it matters and when it doesn't."$$,
    'open', 'newsletter', null, null,
    $${"source": "video-transcripts.md (Pretensioning Springs)", "evaluated": false}$$::jsonb),
  ('The conscious competence model applied to one exercise',
    $$Newsletter-sized application of the framework.$$,
    'open', 'newsletter', null, null,
    $${"source": "topic-backlog.md", "evaluated": false}$$::jsonb),
  ('How lowering the footbar changes load (single-exercise focus)',
    $$Newsletter-sized version focused on one exercise.$$,
    'open', 'newsletter', null, null,
    $${"source": "topic-backlog.md", "evaluated": false}$$::jsonb),
  ('Why the carriage feels different from brand to brand',
    $$System-level differences (frame, wheels, ropes) explain feel more than springs do. Could overlap with the Gratz vs. BB topic; consider whether it's distinct.$$,
    'open', 'newsletter', null, null,
    $${"source": "topic-backlog.md", "evaluated": false}$$::jsonb),
  ('Friction is mostly fiction',
    $$Wheels + bearings = negligible friction in the Pilates setting.$$,
    'open', 'newsletter', null, null,
    $${"source": "topic-backlog.md", "evaluated": false}$$::jsonb),
  ($$What "feels hard" and "loads heavy" aren't the same thing$$,
    $$Adding instability cuts force output, so balance challenges feel hard without loading any one tissue heavy.$$,
    'open', 'newsletter', null, null,
    $${"source": "parking-lot.md", "evaluated": false}$$::jsonb),
  ('Pulley height: rope tension shifts a little, ROM shifts a lot',
    $$Classical (low) vs. contemporary (high) pulley anchors change rope tension by ~5%. ROM is the bigger variable.$$,
    'open', 'newsletter', null, null,
    $${"source": "video-transcripts.md (Pulley Height)", "evaluated": false}$$::jsonb),
  ($$Light springs across brands are nearly identical. The heavy ones aren't.$$,
    $$Across BB, Stott, Align, Peak: light springs match within 5 lbs through full extension; heavy springs vary by 10+ lbs at typical extension ranges.$$,
    'open', 'newsletter', null, null,
    $${"source": "video-transcripts.md (Reformer Springs Across Contemporary Brands)", "evaluated": false}$$::jsonb),
  ($$Why "lower pedal = heavier" on the chair$$,
    $$Unlike the reformer (force is always horizontal), chair springs apply force at varying angles based on pedal height.$$,
    'open', 'newsletter', null, null,
    $${"source": "video-transcripts.md (Intro to chair physics)", "evaluated": false}$$::jsonb),
  ('Same spring settings, very different chair workouts (by body weight)',
    $$A 250 lb and a 140 lb client doing step-up front on the same springs are moving wildly different loads (238 vs. 128 lbs at top of range). Concrete numbers.$$,
    'open', 'newsletter', null, null,
    $${"source": "video-transcripts.md (Body weight on a Pilates chair)", "evaluated": false}$$::jsonb),
  ($$"Easy" doesn't mean wrong$$,
    $$Just because someone says an exercise feels easy doesn't mean they're doing it wrong.$$,
    'open', 'newsletter', null, null,
    $${"source": "blog-reference.md (Just because it is easy...)", "evaluated": false, "note": "extrapolated from title; verify angle by re-reading the post"}$$::jsonb),
  ('Slow done right is the fastest way to learn',
    $$Conscious competence applied to Pilates tempo.$$,
    'open', 'newsletter', null, null,
    $${"source": "blog-reference.md (Slow is Smooth and Smooth is Fast)", "evaluated": false, "note": "extrapolated from title"}$$::jsonb),
  ('When client feedback leads you astray (newsletter angle)',
    $$The most articulate clients aren't always the ones whose feedback you should weight most.$$,
    'open', 'newsletter', null, null,
    $${"source": "blog-reference.md (When Client Feedback Leads You Astray)", "evaluated": false, "note": "extrapolated from title"}$$::jsonb),
  ('The first hands-on cue sets the tone',
    $$Newsletter angle on hands-on cueing.$$,
    'open', 'newsletter', null, null,
    $${"source": "blog-reference.md (What Good Hands-On Cueing Actually Looks Like)", "evaluated": false, "note": "extrapolated from title; verify angle by re-reading the post"}$$::jsonb),

  -- ===== PARKING LOT (treated as regular ideas) =====
  ('Pilates is taught against failure by design',
    $$Hook: We idealize perfect form through a full set. "Finish the set with control" means the session ends before failure by design. That's a meaningful distinction if strength gain is the goal — and it's a pedagogical choice, not a physics constraint.

Source: Drafted into the wt-vs-pilates carousel and then merged out. The mechanism point got compressed into the broader "Strength training is a method" slide and lost its specificity. Worth its own post: how the way we cue (and the way we were taught to cue) actively works against the conditions that build measurable strength — and why that's still a fine choice if strength gain isn't the primary goal.

Audience: Stephanie especially. Cody would resonate. Karen would push back hard.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb),
  ('Instability reduces force output',
    $$Hook: Muscles produce the most force from a stable base. Adding instability cuts what they can put out. So much of Pilates demands balance across multiple joints, which makes it hard to isolate one muscle group enough to truly load any one tissue. What makes Pilates feel hard is also what limits how hard you can load any specific tissue.

Source: Original wt-vs-pilates draft section, dropped from the carousel entirely. Didn't fit in the three-category structure (max load / load profile / progression) but stands on its own as a physics + biomechanics post about why "feels hard" and "loads heavy" aren't the same thing.

Audience: Strong post for Cody. Stephanie would have an "aha" moment. Amanda might bristle at first but come around.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb),
  ('The beginner observation',
    $$Hook: People new to movement progress so quickly in Pilates partly because they do reach failure — just not intentionally. The bar for failure is low enough that Pilates clears it. As they get stronger, it stops clearing it. This explains both why beginners feel transformed and why long-term Pilates clients can plateau.

Source: Original draft, dropped from the carousel for length. This is a genuinely original observation and probably the strongest standalone post in this list. Has implications for both how we explain results to new clients AND how we should think about programming progression.

Audience: Universal. Amanda will recognize her own arc. Cody will appreciate the rigor. Stephanie will use it immediately. Even Karen might engage because it explains the "why my classical work used to transform people" feeling.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb),
  ('Different tools, both true',
    $$Hook: Pilates doesn't produce the same results as strength training. Strength training doesn't produce the same results as Pilates. Both are true. Pretending otherwise in either direction doesn't help anyone.

Source: Was a slide in earlier carousel drafts ("Different tools. Both true."). Dropped because the carousel made the point implicitly throughout. But as a standalone short post or reel, it's a clean philosophical landing.

Audience: Best for the discourse moment when both sides are loud. Could be a reaction post to a viral take.$$,
    'open', 'both', 'Parking Lot', null, null::jsonb),
  ('Normalize the nuance',
    $$Hook: You can believe something is awesome and be willing to hear the ways it might not work the way you think it does. That doesn't take away from the ways it does work. That's not weakness — that's how you grow.

Source: Was the original closing of the wt-vs-pilates carousel, replaced by the meta-physics reframe. Beautiful emotional landing. Could be its own short post about how to hold both technical critique and genuine love for a method, written more universally so it applies beyond Pilates.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb),
  ('Where Pilates fits in the bone density / strength training discourse',
    $$Hook: In today's narrative, it can feel like Pilates is being dismissed. The focus on bone mineral density and pure strength gains highlights where Pilates isn't the strongest method out there. It's still better than nothing, just not the best.

Source: Was a slide in earlier carousel drafts, dropped because it felt defensive. But as a standalone post commenting on the wider conversation — naming the discourse explicitly — it could be a strong reaction piece. Risk: dates quickly as the discourse moves on.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb),
  ($$"Let's get the language right"$$,
    $$Hook: Strength training is a method, just like Pilates is a method. That doesn't mean you can't get stronger or feel stronger using Pilates. They're just two methods focused on different things.

Source: Was a slide, dropped because the point gets made implicitly. As a standalone short post, it's a precision-of-language piece — useful for instructors who want better vocabulary for client conversations.$$,
    'open', 'blog', 'Parking Lot', null, null::jsonb)

)
insert into public.content_ideas (title, notes, status, format, category, difficulty, newsletter_data)
select s.title, s.notes, s.status, s.format, s.category, s.difficulty, s.newsletter_data
from seed_ideas s
where not exists (
  select 1 from public.content_ideas e where e.title = s.title
);
