-- ============================================================
-- Pilates Physics: Blog draft seed - "Do the Hamstrings Pull the
-- Carriage In During Footwork? The Physics of Energy on the Reformer"
--
-- Source: docs/blog-drafts/hamstrings-footwork.md (H1 and subtitle
-- stripped; the page renders the title itself). Native post, so
-- canonical_url stays null. No images.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for publishing. Safe to re-run: ON CONFLICT (slug) DO NOTHING means a
-- second push never clobbers edits made in the admin editor.
--
-- BEFORE PUBLISHING, in the admin editor:
--   1. Add a featured image plus alt text.
--   2. Set status to Published. Leave "Published at" blank to use now.
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'hamstrings-footwork-carriage-return',
  'Do the Hamstrings Pull the Carriage In During Footwork? The Physics of Energy on the Reformer',
  $excerpt$It's a common footwork cue, and the physics says otherwise. Follow the energy between your muscles, the springs and the wheels to see who really brings the carriage home.$excerpt$,
  $body$## Two laws you've heard named, and never explained

In Pilates-land I've heard people mention Newton's Laws and the Law of Conservation of Energy, but never in any more detail than the names. Even to me, a trained engineer, that isn't helpful.

So here are the basic definitions.

**Newton's first law:** an object in motion stays in motion unless an outside force acts on it.

**The Law of Conservation of Energy:** energy is never created or destroyed in a system. The total energy at the start of an action equals the total energy at the end. It only changes form.

Great, definitions. But what do they mean for your teaching?

## Newton's first law on the reformer

If you start something moving, like a carriage, it won't stop unless something stops it. On the reformer, that something is friction and spring force. So of course the carriage doesn't roll forever. In our everyday world there is almost always an outside force slowing a moving object down. (In space there often isn't, which is why a spacecraft can coast for years with its engines off.)

It works backwards too. If something stops, there are forces stopping it. Your job is to ask which ones.

Honestly, I don't think Newton's first law does much for Pilates teachers beyond that. Energy is where it gets useful.

## Conservation of energy on the reformer

Creating movement takes energy. On the reformer, your muscles, the springs and the carriage wheels are constantly trading energy back and forth. Count all of it, including what friction turns into heat, and the total at the start of a rep equals the total at the end. That trading is what creates the movement.

In footwork, on the push out, your muscles give energy and the springs and wheels (friction) take it in. On the way back in, the springs give energy and your muscles and the wheels take it in.

Notice the pattern: **concentric contractions give energy to the system, and eccentric contractions absorb it.**

That one idea is surprisingly powerful.

## Energy transfer and a footwork myth

So far this is still pretty abstract. Here's where it gets practical. We often hear cues in Pilates to engage more muscles than a movement actually needs. But if you engage more muscles, they're either giving or absorbing energy, right? So where does that extra energy come from, and where does it go?

A common example: in footwork, the hamstrings should pull the carriage back in.

The physics doesn't support it. Yes, you can feel your hamstrings more if you focus on them and squeeze. But they don't take over the movement. What you've created is a co-contraction.

Dr. Gabriele Wulf's research on attentional focus shows exactly this. When people focus on their own muscles (an internal focus), muscle activity goes up for the same task, the opposing muscles co-contract more, and force and accuracy get worse than when they focus on the effect of the movement (an external focus) [1, 2, 3]. Co-contraction is a legitimate strategy, but it isn't how you produce maximum force, and it doesn't build efficient motor control over the long term [4].

Let's use energy transfer to see why.

### Define the movers

First, the two joints we care about here: the knee and the hip.

- **Knee flexors:** hamstrings. **Knee extensors:** quads.
- **Hip flexors:** psoas and rectus femoris (the one quad that crosses the hip). **Hip extensors:** glutes, with help from the hamstrings.

On the way out, the hips and knees extend. On the way in, they flex.

I think this is where the hamstring idea comes from. The knee is flexing on the return, and the hamstrings flex the knee.

But remember, a muscle creates a joint action with a *concentric* contraction, which means it's giving energy to make that movement happen.

When a joint moves while absorbing energy, the muscle on the *opposite* side is controlling it eccentrically. So when the knees flex on the return and the body is absorbing the springs' energy, it's the quads, the same muscles that pushed the carriage out, now working eccentrically.

Put the joint actions together with the springs and the wheels into one energy system, and it becomes clear that the hamstrings aren't contributing much energy to footwork.

### Breaking it down

|  | Push out | Return |
| :---- | :---- | :---- |
| Joint action | Knees extend, hips extend | Knees flex, hips flex |
| Energy flows | Muscles to springs + wheels (friction) | Springs to muscles + wheels (friction) |
| Muscle contraction | Concentric | Eccentric |
| Therefore | Quads and glutes working | Quads and glutes working |

## What this means

Our bodies respond naturally to external forces. In Pilates, we often try to change how they respond. Sometimes that means shifting focus between agonist muscles, which are all moving energy in the same direction. But too often we encourage the *antagonist* muscles to work, and that adds a different energy component to the system.

Take the footwork return. If you ask the hamstrings to do the work, that work has to be concentric, because the knee is flexing. But the springs are already doing that job. A concentric hamstring contraction can't *absorb* energy. It gives energy. And if the hamstrings are giving energy, something has to absorb it. The springs can't, because they're releasing energy at this point. The wheels can't absorb much more friction than they already are. So the most likely answer is that the quads and glutes work *harder* eccentrically to absorb it.

So yes, you can ask the hamstrings to contract on the carriage return. But it's a co-contraction. They are never the prime movers of the carriage in this direction. Energetically, they can't be.

**The one exception: they out-pull the springs.** For the hamstrings to become the prime mover, they'd have to pull harder than the springs are already pulling. That means drawing the carriage home *faster* than the springs alone would send it, which is not what anyone means by this cue.

**A note on pressing down.** You can feel more hamstring and glute on the return if you press *down* into the footbar. But that's a different exercise, heading into bridge territory. You can only press down so far before your hips lift off the carriage.

## Your takeaway

Cueing the hamstrings to pull the carriage in works against how the reformer loads the body. It's confusing for the client, and it implies the quads and glutes shouldn't be working on the return. Because of how energy moves through the system, they *have* to.

If you want to cue pressing down and drawing the carriage in to warm up the hamstrings along with the glutes and quads, go for it. Just know the hamstrings will never be the prime mover.

Want to understand what the springs and carriage are doing on every exercise? Start with [the spring calculator](/spring-calculator), or go deeper in [How a Reformer Works](/how-a-reformer-works).

## References

1. Vance, J., Wulf, G., Töllner, T., McNevin, N., & Mercer, J. (2004). EMG activity as a function of the performer's focus of attention. *Journal of Motor Behavior, 36*(4), 450–459.
2. Lohse, K. R., Sherwood, D. E., & Healy, A. F. (2011). Neuromuscular effects of shifting the focus of attention in a simple force production task. *Journal of Motor Behavior, 43*(2), 173–184.
3. Wulf, G. (2013). Attentional focus and motor learning: A review of 15 years. *International Review of Sport and Exercise Psychology, 6*(1), 77–104.
4. Wulf, G., & Lewthwaite, R. (2016). Optimizing performance through intrinsic motivation and attention for learning: The OPTIMAL theory of motor learning. *Psychonomic Bulletin & Review, 23*(5), 1382–1414.$body$,
  'draft'
)
on conflict (slug) do nothing;
