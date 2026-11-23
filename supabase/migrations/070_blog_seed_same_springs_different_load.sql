-- ============================================================
-- Pilates Physics: Blog draft seed - "Same reformer springs, different load"
--
-- Source: docs/blog-drafts/same-spring-different-load.md (front matter,
-- editor comment and H1 stripped; the page renders the title itself).
-- Built from the Teaser torque reel (2026-10-13), the Feet in Straps hip
-- torque carousel (2026-11-12) and the "bridge that could only clench"
-- story in docs/marketing/story-bank.md. Native post, so canonical_url
-- stays null.
--
-- Numbers: per-leg hip torque from one body model (leg 18% of body
-- weight, 49% of height, center of mass 43% hip to ankle). Teaser legs at
-- 45 degrees. Feet in Straps legs 30 degrees above horizontal, ropes 6
-- degrees below, Balanced Body red + blue. The Teaser figures were
-- recomputed with this model, so they differ from the Oct 13 reel.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for images and publishing. Safe to re-run: ON CONFLICT (slug) DO
-- NOTHING means a second push never clobbers edits made in the admin
-- editor.
--
-- BEFORE PUBLISHING, in the admin editor:
--   1. Add the Feet in Straps diagram (carousel slide 5: leg angle, rope
--      angle, leg center of mass, spring force) to the body, right after
--      the paragraph that opens "Teaser shows a different amount of load".
--      The draft's [IMAGE] placeholder was left out of this seed so it
--      can't render as literal text.
--   2. Add a featured image plus alt text. The same diagram works.
--   3. Title is 37 characters, so the <title> with " | Pilates
--      Physics" stays under 60. Excerpt is 158 characters, inside the
--      70 to 160 range the SEO audit checks. Keep both inside those
--      limits if you edit.
--   4. Set status to Published. Leave "Published at" blank to use now.
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'same-reformer-springs-different-load',
  'Same reformer springs, different load',
  $excerpt$Two clients on the same reformer springs can be doing different exercises. Here's how body weight and leg length change the load in Teaser and Feet in Straps.$excerpt$,
  $body$I was teaching a group class, and we were doing bridge on the reformer. The intent wasn't "get your hips up." It was the pelvic rock, and articulating up through the spine one segment at a time. How you get to the top matters more than the fact that you got there.

One client in a bigger body was on the same springs as everyone else in the room, and the only way they could get up was by gripping. Everything above the pelvis moved as one block.

I cued it every way I had. Rock your pelvis. Peel up like a wave. Let your spine be heavy, like a hammock. Hips, then low back, then ribs. Nothing landed.

So I added a spring.

Not to make it harder. To give them more support. And the articulation showed up almost immediately.

More spring made it easier. If the same spring setting meant the same exercise for everyone, that shouldn't be possible. So let's talk about why it is.

### Where load comes from on the reformer

When I say load, I am almost always talking about external load.

On a reformer, external load comes from two places. The first is obvious: the springs. The second is easy to forget: the body itself. Legs, arms, the head and the pelvis all weigh something, and they're attached to joints that have to move them and hold them.

The joint doesn't care where the load comes from. It just feels the total.

To compare them, we need one physics idea: torque. Torque is a force that rotates something around a point. Your joints are those points. A spring pulling on your foot creates torque at your hip. So does the weight of your leg.

How much torque? That depends on two things:

**Torque = Force × distance**

- **Force** is how heavy the thing is, whether it's a spring or a leg.
- **Distance** is how far from the joint that force acts. This is called the moment arm.

Before your eyes glaze over: you don't have to (and shouldn't) do math while you're teaching. I certainly don't. The equation for torque is useful because it names the two dials that matter: how heavy, and how far out. Make either one bigger and the load on the joint goes up.

Now let's put some numbers to it to illustrate the concept.

### Teaser: how body weight and leg length change the load

Teaser is a good place to start because the springs aren't really part of the hip's job. The load at the hip is almost entirely the weight of the legs.

You've probably seen this. Two new clients try Teaser. One pops right up with straight legs. The other's knees bend, they can't quite fold in half, and maybe they even tip backward.

Of course that has to do with strength. But it's not all strength.

Take two clients who are both 5'5", one who weighs 130 pounds and one who weighs 250. Their legs are the same length, so with the legs at 45 degrees, the moment arm is the same. But their legs don't weigh the same.

| Same height, 5'5" | 130 lb client | 250 lb client |
|---|---|---|
| Torque at the hip, per leg | 227 lb-in (26 Nm) | 436 lb-in (49 Nm) |

That's 92% more load at the hip for the heavier client. To hold the same position, their hip flexors have to produce 92% more torque.

Now look at height. Two clients who both weigh 160 pounds, one 5'2" and one 6'0". Their legs weigh about the same, but the taller client's legs are longer, so the weight sits farther from the hip.

| Same weight, 160 lb | 5'2" client | 6'0" client |
|---|---|---|
| Torque at the hip, per leg | 266 lb-in (30 Nm) | 309 lb-in (35 Nm) |

About 16% more for the taller client. It's smaller than the weight difference, but it's still real.

So the client who "can't do Teaser yet" may simply be at a different starting point.

### Feet in Straps: why the same springs support one client and resist another

Teaser shows a different amount of load from body weight. Feet in Straps shows something more surprising: what happens when body weight and spring load combine.

In Feet in Straps, two things are acting on the hip. The weight of the legs pulls them down toward the carriage. The springs, through the ropes, pull them up and back. What the client has to do depends on which one wins.

Let's take two clients who are both 5'9", one who weighs 150 pounds and one who weighs 300. Both are on a Balanced Body red and blue. Legs at 30 degrees above horizontal. Same everything except body weight.

| 5'9", red + blue | 150 lb client | 300 lb client |
|---|---|---|
| Net torque at the hip, per leg | +89 lb-in (10 Nm) | -260 lb-in (-29 Nm) |

Wait. Why is one of them negative?

For the 150 pound client, the springs are winning. They pull the legs up harder than the legs weigh, so this client has to **press their legs down** against the springs to maintain the position.

For the 300 pound client, the legs are winning. They weigh more than the springs can hold, so this client has to **hold their legs up** against gravity.

Same springs. Same exercise. Same cue from the teacher. Completely different jobs for the muscles.

I've talked before about springs being supportive or resistive. This is what that looks like in real life. The same red and blue is resisting one client and supporting the other. And if you're cueing "press your legs down into the straps," one of those two people has no idea what you're talking about.

That's what was happening in my bridge class. The setting that gave the rest of the room a reasonable challenge was too much load for one client to feel what I was asking of them. The extra spring took some of that load off, and once it did, there was room to experience my intent for the exercise.

### How to adjust spring settings for different bodies

You don't need to do the math for every client. Feedback from the client is vital. We're trained to observe our clients and read their movement for struggle and ease, stiffness and fluidity. But we don't ask them often enough what they feel. Their experience is a key piece of information in your decision-making process. Your job is to know what you're hoping they feel, and why, and then use your Pilates Physics knowledge to make the appropriate setup changes.

Start with intent. In Feet in Straps, do you want them working to press down, or working to hold up? In bridge, are you after maximum load, or are you after articulation? Those are different goals, and the right setting for one client might be the wrong one for the person on the next reformer.

Then remember that the spring is the loudest dial, not the only one. Rope length, gear setting, footbar height, leg angle, and so on. Every one of those changes the load.

When a client doesn't feel what you're describing, it's usually not them. Most of us were taught one setting for the room, so we assume load isn't the problem when it often is.

This matters because a client who never feels what everyone else seems to feel will eventually decide the problem is their body. They'll wonder what they're doing wrong, feel dejected, and might even decide Pilates isn't for them.

In so many cases, it's simply the wrong load.

As the instructor, you're the person in the room who can fix that.

The memorized spring setting is where you start. Learn how load is applied to your clients so you can become the teacher who knows exactly what to adjust for each body to achieve your intent.

The springs are the other half of the load. If you want to see what that half is actually doing, my free [spring calculator](/spring-calculator) plots the springs from seven major reformer brands together. Add up your own custom combination, compare across weights or brands, and run your own experiment to see just how differently two clients can experience your standard footwork springs.

---

*Real bodies vary in weight distribution, limb proportions, and strength more than my examples can show. I held as many variables constant as possible to show the effect of one change at a time. That's not because it's exactly what your client is feeling, but because it clearly illustrates the concept. My numbers are based on anthropometric data like the [NC State Ergonomics Center's anthropometric data tables](https://multisite.eos.ncsu.edu/www-ergocenter-ncsu-edu/wp-content/uploads/sites/18/2016/06/Anthropometric-Detailed-Data-Tables.pdf) and [segment weights as percentages of total body weight](https://bionumbers.hms.harvard.edu/files/Segment%20weights%20as%20percentages%20of%20total%20body%20weight%20and%20trunk%20segments%20as%20a%20percentage%20of%20trunk%20weight.pdf) from Harvard's BioNumbers.*$body$,
  'draft'
)
on conflict (slug) do nothing;
