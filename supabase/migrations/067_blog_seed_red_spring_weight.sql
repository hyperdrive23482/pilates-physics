-- ============================================================
-- Pilates Physics: Blog draft seed - "How much does a red spring weigh?"
--
-- Source: docs/blog-drafts/how-much-does-a-red-spring-weigh.md (front
-- matter and H1 stripped; the page renders the title itself). Written
-- for the search "how much does a reformer spring weigh", the second
-- content idea from the admin SEO dashboard's recommendations
-- (2026-10-14). Native post, so canonical_url stays null.
--
-- Every number in the body comes from src/data/springSpecs.json (the
-- spring calculator's dataset, F = k * x + b, rounded to the nearest
-- pound) or from the two published posts it links to:
-- 'comparing-springs-across-brands' and
-- 'balanced-body-duro-springs-measured'. The Gratz section cites
-- Gratz's recently published data (Kaleen, 2026-10-14; the prod Duro
-- post was updated to match). Nothing was measured for this post.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for a featured image and publishing. Safe to re-run: ON CONFLICT
-- (slug) DO NOTHING means a second push never clobbers edits made in
-- the admin editor.
--
-- BEFORE PUBLISHING, in the admin editor:
--   1. Add a featured image plus alt text. A Compare-mode screenshot of
--      the calculator with every brand's red selected fits the post, and
--      could also be dropped into the body under "Now the other reds".
--   2. Confirm 'comparing-springs-across-brands' and
--      'balanced-body-duro-springs-measured' are both published on prod
--      (migration 066 updates their titles and excerpts, so they should
--      be). A draft link 404s for readers.
--   3. Title is 33 characters, so the <title> with " | Pilates Physics"
--      stays under 60. Excerpt is within the 70 to 160 character range
--      the SEO audit checks. Keep both inside those limits if you edit.
--   4. Set status to Published. Leave "Published at" blank to use now.
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'how-much-does-a-red-spring-weigh',
  'How much does a red spring weigh?',
  $excerpt$A red spring is not a single weight. Across six reformer brands, red starts anywhere from 6 to 17 pounds at rest and climbs with every inch of carriage travel.$excerpt$,
  $body$Every 5 weeks I teach an intro to Pilates class that welcomes new students to the reformer. Inevitably, someone asks me what the spring colors mean and how much a reformer spring weighs.

My answer is, "It depends."

I know. That's annoying. So here's the actual range, pulled straight from the published spring data in my free [spring calculator](/spring-calculator).

**At rest, a red reformer spring pulls somewhere between 6 and 17 pounds, depending on the brand. Eighteen inches into a press, that same red is pulling between 26 and 38 pounds.**

Well, that's a mouthful. What does that *really* mean?

A red spring is not a single weight. Here's why.

### A spring doesn't have a weight. It has a slope.

When someone asks how much a spring weighs, they aren't asking what it weighs on a postal scale. They want the gym equivalent. How many pounds does "one red" stand for, so I can compare it to what I do in my Body Pump class?

Here's the thing. A spring doesn't have just one weight like a dumbbell does. A 10 pound dumbbell is 10 pounds at the start of a rep and 10 pounds at the end. A spring, though, gets heavier the more it's stretched, and it does so in a straight line.

This is called Hooke's Law, and it's represented by an equation:

**Force = (k × stretch) + b**

- **b** is the preload, the pull already on the spring before the spring stretches at all.
- **k** is the rate, how many more pounds of resistance you get for every inch the spring stretches.
- **stretch** is how far the spring gets pulled.

So "how heavy is it" always comes with a second question attached: at what point in the stretch?

### One red, inch by inch

Why am I doing the math here? Because a table makes this click faster than any other explanation I've found.

Let's look at a Balanced Body red reformer spring. Its published value starts at 8 pounds and climbs 1 pound for every inch the carriage travels out.

| Carriage travel | Load on one Balanced Body red |
|---|---|
| At rest | 8 lb |
| 6 inches | 14 lb |
| 10 inches | 18 lb |
| 18 inches | 26 lb |
| 24 inches | 32 lb |

This is why I say the same setting isn't the same workout. A taller client with longer legs presses the carriage further and finishes higher on that line. A shorter client on the same red might never get to 18 inches at all. Same spring, same room, two different exercises.

### Now the other reds

This is where it gets fun. Seven reformer brands are in the calculator, and six of them make a red spring. And they aren't the same!

| Brand | Where red sits in the lineup | At rest | At 10 inches | At 18 inches |
|---|---|---|---|---|
| Balanced Body | Second-heaviest of four weights | 8 lb | 18 lb | 26 lb |
| Merrithew (listed as Stott in the calculator) | Second-heaviest of four weights | 7 lb | 19 lb | 29 lb |
| Align Pilates | Second-heaviest of four weights | 6 lb | 18 lb | 28 lb |
| BASI | Heaviest of three | 7 lb | 19 lb | 28 lb |
| Peak Pilates | Heaviest of four | 17 lb | 29 lb | 38 lb |
| Elina | Heaviest of three | 11 lb | 25 lb | 37 lb |

Red means second-heaviest for Balanced Body, Merrithew and Align. It means heaviest for Peak, BASI and Elina. And none of them are exactly the same at every amount of stretch.

The color simply tells you where a spring sits in its own brand's lineup.

Now look at the 10 inch column. Balanced Body, Merrithew, Align and BASI all land at 18 or 19 pounds there. Four different brands, basically the same spring in the middle of the stroke. That's why a conversion chart can put them in the same column. It's also why a conversion chart is only a starting point, because they start at different preloads and climb at different rates. Springs that match in the middle drift apart at both ends. I graphed all of that in [my cross-brand spring comparison](/blog/comparing-springs-across-brands) if you want to see the lines cross.

And then there's Peak. A Peak red pulls 17 pounds before the carriage moves. That's more than double the Balanced Body red at rest! It stays the heaviest red through the whole stroke, too. If you're used to one red on a Balanced Body reformer and someone hands you one red on a Peak reformer, you're on a noticeably heavier spring from the very first inch.

### What about Gratz?

Gratz makes one standard reformer spring and doesn't color code it, so it's not in the table. But we know from recently published data from Gratz, and from my own measurement of two of their new springs, that it's roughly equivalent to a Balanced Body red spring.

### Why the same red still might not feel the same

Everything above comes from published curves. Real springs are a little messier than that.

Springs change with age, use and the conditions they live in. Over time they do wear out, and often it's so gradual we don't notice until it's side by side with a new spring. Even nearly new springs can be off. When I [measured a lightly used set of Balanced Body's Duro springs](/blog/balanced-body-duro-springs-measured), the green came in lighter than all three reds in the box.

And the machine can change the feel, too. Put the same red on two different reformers and the same exercise can stretch it two different distances. Carriage travel depends on the client's body dimensions and the reformer's dimensions, so the same body doing the same exercise on a different machine pulls the spring a different distance. Same spring, different point on the graphed line, different load.

So the honest answer to "how heavy is one red" depends on the brand, the machine, and the client's body.

### So what do you do with this?

You don't need to carry the table around. When you switch brands, you can use [a conversion chart](/blog/comparing-springs-across-brands) as a starting place. When a client says a spring feels heavy or light, ask yourself where in the stretch they're working. A short client and a tall client on the same red are living on different parts of the same line.

If you want to see the lines for yourself, the [spring calculator](/spring-calculator) plots spring weights from seven major brands, lets you stack springs and add them up, and lets you lay two brands' reds side by side.

A red spring is not a single weight. I wish it was! But once you know that, you stop asking what the spring weighs and start asking what it's doing to the body in front of you. That's the question worth answering.$body$,
  'draft'
)
on conflict (slug) do nothing;
