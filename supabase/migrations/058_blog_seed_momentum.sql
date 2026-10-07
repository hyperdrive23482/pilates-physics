-- ============================================================
-- Pilates Physics: Blog draft seed - "Does Moving Faster on the
-- Reformer Make Pilates Easier? The Physics of Momentum"
--
-- Source: docs/blog-drafts/momentum.md (front matter and H1 stripped;
-- the page renders the title itself). Native post, so canonical_url
-- stays null. Graphs are drawn in docs/blog-drafts/momentum-graphs.html.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for images and publishing. Safe to re-run: ON CONFLICT (slug) DO
-- NOTHING means a second push never clobbers edits made in the admin
-- editor.
--
-- BEFORE PUBLISHING, in the admin editor:
--   1. Export the four PNGs from momentum-graphs.html, upload them to the
--      blog-images bucket, and replace the placeholders IMG_MOMENTUM_SPRING,
--      IMG_MOMENTUM_SLOW, IMG_MOMENTUM_SLOW_GAP and IMG_MOMENTUM_FAST with
--      their URLs. Alt text is already in the markdown.
--   2. Add a featured image plus alt text.
--   3. 'progressive-overload-in-pilates' (seed 055) is still a draft on
--      prod. Publish it first or drop that link, because a draft link
--      404s for readers. The spring link points at
--      'comparing-springs-across-brands', the published slug on prod.
--   4. Set status to Published. Leave "Published at" blank to use now.
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'reformer-momentum-slow-vs-fast',
  'Does Moving Faster on the Reformer Make Pilates Easier? The Physics of Momentum',
  $excerpt$Going faster on the reformer feels easier for a reason. Here's how momentum changes the force your muscles produce, and when speed is the goal.$excerpt$,
  $body$Momentum is stealing your spring resistance. Whether that's bad or good depends on your intent.

One of the first corrections I remember learning to give as a Pilates instructor was about pace on the reformer. The classic scenario: someone moves so fast during arms in straps that the ropes go slack and the spring resistance disappears. Then comes the immediate gratification when they slow down, as instructed, and say it's harder.

Instinctively, I knew momentum made most Pilates movements feel easier. But as my conversations with the Pilates world about physics deepened, explaining the science behind it became more and more urgent. Why do we want to go slower? Is going faster bad? What are the training effects of speed?

Let's dig in.

The short version: momentum lets the carriage keep moving without your muscles pushing the whole way, so a fast rep can peak at far less force than a slow one on the same springs. That isn't bad. It just trains something different.

## What is momentum in Pilates?

First, let's define momentum. Momentum tells you how hard it is to *stop* something that's moving. The physics definition is "mass in motion," but I think that's hard for most of us to grasp. The equation is mass times velocity (p = m × v). Change either the mass or the velocity of something, and its momentum changes.

## Footwork vs. jumpboard: momentum in action

In the Pilates studio, the clearest way to see momentum in action is to compare jumpboard work with footwork. In footwork, we (ideally) feel the spring resistance through the whole range of carriage movement. The pace is slow compared to jumping, and the springs are often heavier.

With jumping, we apply a larger, faster force at the beginning of the movement, then coast until it's time to catch the carriage at home again. The springs are often lighter than for footwork.

Our bodies experience these two movements very differently. You can feel more muscle "burn" and cardiopulmonary stress in jumping than in footwork, even with lighter springs.

## Does moving faster on the reformer reduce resistance?

Let's graph spring stretch and force during footwork. Assume a 6' tall person stretching the springs 18" on red, red, and green springs.

The horizontal axis plots spring stretch out to 18" and back to 0". The vertical axis plots force.

Here's the spring force in this scenario. It starts at 26 lbs, rises to 88 lbs at full extension, and returns to 26 lbs as the carriage comes home. (If you're wondering why the force changes so much across one rep, that's because [a spring is not one weight](/blog/comparing-springs-across-brands).)

![Spring force across one footwork rep on red, red, and green springs. It rises in a straight line from 26 lbs at 0 inches of stretch to 88 lbs at 18 inches, then falls back to 26 lbs as the carriage returns.](IMG_MOMENTUM_SPRING)

When you go slow, the muscles exert a little more force than the springs at first, then a little less as the carriage slows near full extension. On the way back, the springs exert more force than the muscles while the carriage speeds up, and the muscles exert more while it slows down.

![Slow footwork rep with muscle force plotted over spring force. Muscle force starts slightly above the springs, crosses them at mid-range, and peaks at about 83 lbs, just under the 88 lb spring peak.](IMG_MOMENTUM_SLOW)

The gap between those two curves shows how much the carriage is speeding up or slowing down.

![Shaded gap between muscle force and spring force on a slow footwork rep. The gap stays small through the whole rep, showing the carriage barely speeds up or slows down.](IMG_MOMENTUM_SLOW_GAP)

Notice the peak force the muscles reach: just under the 88 lb max spring force.

Now compare a faster rep. The spring force is plotted exactly the same way, because springs don't care about speed. They only care how far they're stretched.

But to get the carriage moving faster, the gap between spring force and muscle force grows. And the muscle force doesn't have to climb as high to stretch the springs the same distance.

![Fast footwork rep. Muscle force holds near 57 lbs while spring force rises from 26 to 88 lbs and back, leaving a large shaded gap between the two curves.](IMG_MOMENTUM_FAST)

Notice that the area between the muscle and spring curves is bigger here, because the change in speed is bigger. Now look at the peak muscle force: 57 lbs! That's quite a bit lower than the 88 lbs of the slower rep.

And 57 isn't a random number. It sits exactly halfway between 26 and 88. At this pace, the muscle force barely changes at all while the springs do all the rising and falling. That's also the lowest peak your muscles can get away with on these springs. Go any faster and the effort shifts to a hard push at the start of the rep, then a coast. Sound familiar? That's jumping.

## Is momentum bad in Pilates?

A different peak load doesn't make one approach better than the other. They're simply different.

If your goal is peak muscle force, slower is better. If your goal is developing power, you have to move quickly. I'd suggest, though, that training for each of those probably calls for different spring weights. Either way, knowing which one you're after is what makes [progressive overload in Pilates](/blog/progressive-overload-in-pilates) possible.

Speed matters for learning, too. When a movement is new, the nervous system tends to stiffen the joints by contracting opposing muscles at the same time, called co-contraction. As the movement is learned, co-contraction drops and the muscles work more efficiently ([Osu et al., 2002](https://pubmed.ncbi.nlm.nih.gov/12163548/)). That's one more reason to slow down when someone is learning a movement, and to add speed later.

Want to understand what the springs and carriage are doing on every exercise? Start with [the spring calculator](/spring-calculator), or go deeper in [How a Reformer Works](/how-a-reformer-works).

---

**Reference**

Osu R, Franklin DW, Kato H, Gomi H, Domen K, Yoshioka T, Kawato M. Short- and long-term changes in joint co-contraction associated with motor learning as revealed from surface EMG. *J Neurophysiol.* 2002;88(2):991-1004. PMID: [12163548](https://pubmed.ncbi.nlm.nih.gov/12163548/)$body$,
  'draft'
)
on conflict (slug) do nothing;
