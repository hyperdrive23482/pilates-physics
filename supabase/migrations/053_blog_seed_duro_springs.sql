-- ============================================================
-- Pilates Physics: Blog draft seed — "I measured Balanced Body's new Duro springs"
--
-- Measured resistance of a reader's lightly used set of Balanced Body
-- Duro springs (3 red, green, blue, yellow) against Balanced Body's
-- published values for their regular springs. Native post, so
-- canonical_url stays null.
--
-- Inserted as a DRAFT so it appears in /admin/content/blog-posts ready
-- for graphs, a featured image and publishing. Safe to re-run:
-- ON CONFLICT (slug) DO NOTHING means a second push is a no-op and will
-- never clobber edits made in the admin editor.
--
-- The IMG_* tokens in the body are placeholders. After pushing, open the
-- draft in the admin editor, upload each graph ("Upload image for body"),
-- and replace the matching token with the returned URL:
--   IMG_DURO_BY_COLOR -> measured vs published graphs, one per color
--   IMG_DURO_ALL      -> all measured springs graphed together
--
-- body_html is left null on purpose. BlogPost.jsx falls back to rendering
-- body_markdown, and the first save in the editor populates body_html.
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, body_markdown, status)
values (
  'balanced-body-duro-springs-measured',
  'I measured Balanced Body''s new Duro springs',
  $excerpt$A studio owner sent me a set of Balanced Body's new Duro springs, so I measured them. Three of the four colors landed close to the published values. The green did not.$excerpt$,
  $body$Earlier this year Balanced Body released new Duro springs, designed to last longer in high-intensity, high-use studios. The colors are the same, but it was unclear if the resistances would be equivalent. I made a reel a while back about how changing a few design factors could, in theory, make a spring that lasts longer at the same resistance, and I couldn't wait to get my hands on a real set to test myself.

These springs came from one of you, my friends! A studio owner bought them, tried them for a few days, and didn't like them. She offered to send them to me to make a video, and I said hell yes! So, while these springs aren't straight out of the box, I would expect their measured values to be basically the same as new given how little use they got.

### How heavy are they?

The first question I wanted to answer was do the Duro springs actually have the same resistance profiles as the regular Balanced Body springs? The website was unclear because for some reason, all their springs have spring graphs as a photo in the product carousel, except for the Duro springs. But after measuring these myself, I think they are meant to be the same.

I say “meant to be the same,” because three of the four spring colors I measured were pretty darn close to the published values Balanced Body has for their regular springs.

The green spring was the outlier. Green is supposed to be a step heavier than red, but this one measured slightly lighter than all three reds.

But I’ll give Balanced Body some grace here, because I suspect this is an anomaly and my sample size is small.

### Measuring them

Measuring spring resistance is pretty simple. You need a luggage scale secured to a surface, and a post at a set distance from the scale. Attach one end of the spring to the scale, note where the spring end is at rest. Then stretch the spring to the post, noting how far that post is from the spring end at rest. That distance is how far you've stretched the spring. Read the scale.

Here are my measured results for 3 red Duro springs, a green Duro spring, a blue Duro spring, and a yellow Duro spring.

![Measured Duro spring resistance compared to Balanced Body's published values, by color](IMG_DURO_BY_COLOR)

Looking at the graphs, you’ll notice that the green spring is significantly lower than the published value. When graphing all the measured springs together, you can see the green spring is actually at the low end of the measured red springs, when it should be definitively heavier!

![All measured Duro springs graphed together](IMG_DURO_ALL)

### What not to do with this data

I hesitate to publish this data because the internet is what it is. I want to give Balanced Body kudos for publishing any sort of spring weight chart. They are one of only five manufacturers who voluntarily do. Merrithew, Peak, BASI, and Align are the others.

But, that means now they can be measured against what they say. And my measurements show one was noticeably off.

I've measured one set of their springs, so this shouldn't change your mind about them or anyone else. And brands that don't publish data aren't better (or worse) just because there's nothing to check them against. This is a starting place for a deeper dive.

### What this means for other content I’ve made

Gratz is one of the brands that does NOT publish spring data. I called and spoke to someone who told me they'd email me. I didn’t hear anything. I also tried emailing. Again, nothing.

I had two brand new Gratz reformer springs, still in the box, from back in my maintenance business days, and measured them. That’s how I got their data for my [spring calculator](/spring-calculator).

Their measured value is nearly equivalent to the published values of a red Balanced Body spring, which shocked a lot of people when I shared it. Many people thought that the Gratz reformer springs would be the same as a green Balanced Body spring. Now, if my measurement of the green Duro spring is representative of all others (I doubt it, but can’t prove it), then lots of people would be right! A Gratz reformer spring could be the same weight as a green Balanced Body spring and a red spring.

### What this means moving forward

Consider this can of worms opened. This one experiment is only the beginning of what has to be a deeper and wider dig into Pilates springs.

If I had to make ANY conclusion from this experiment, I’d say that there are probably far more setups out there, across every brand, with springs that don't measure what their color says.

I could have said that without this experiment, though (and I have, when talking about springs wearing out), because we don't have a routine way to check springs when they arrive or as they age.

No one can draw real conclusions yet. All we have are case studies and anecdotes.

I’d like to change that. I’m noodling on it.$body$,
  'draft'
)
on conflict (slug) do nothing;
