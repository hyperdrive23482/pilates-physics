---
name: page-design
description: >-
  Build or edit the layout, spacing, alignment and section structure of a
  Pilates Physics page so it matches the rest of the site. Use whenever adding a
  section to a page, building a new landing page, or fixing anything that looks
  off visually: "this spacing looks small", "why are the sections aligned
  differently", "these sections look narrow", "add a photo to this section",
  "make this match the other pages", "the heading is the wrong size", "add a
  purchase block". Also use before shipping any page change, to run the
  consistency checklist. This skill owns layout and CSS classes. Its companion
  page-framework-audit owns copy and messaging; reach for that one when the
  question is what a section says rather than how it is built.
---

# Page design

The site looks consistent because every page is assembled from the same small
set of section patterns. The patterns are real, they are used across five pages,
and almost none of them are written down anywhere except in the JSX of the page
that happens to use them. That is why the same spacing and alignment corrections
keep coming back.

This skill is the assembly manual. [design-system.md](../../../docs/design-system.md)
is still the source of truth for tokens, the type scale, the italic-accent rule,
decorative elements and the "what not to do" list. **Read it for the atoms. Read
this for how they go together.** Do not duplicate its content here.

## How the system is actually organised

Two layers, and confusing them is the root of most mistakes.

**Shared primitives** live in `src/styles/ppv2.css`: `.container`,
`.section-pad`, `.btn`, `.kicker`, `.fcard`, `.meet__photo`, `.spec-list`,
`.grid-bg`, the section banding. Every page uses these unchanged.

**Per-page section classes** live in that page's own CSS file, under that page's
own prefix:

| Page | CSS file | Prefix |
|---|---|---|
| Landing | `src/pages/Landing.css` | none, bare names (`stakes`, `meet`, `plan`, `cta`) |
| PP101 and PP102 | `src/pages/Workshop.css` | `workshop-` |
| Spring calculator | `src/pages/SpringCalculatorLanding.css` | `springs101-` |
| About | `src/pages/About.css` | `about-` |
| How a Reformer Works | `src/components/course/course-sales.css` | `course-` |

**The course sales page is the exception, and it matters.** It borrows
`workshop-*` classes wholesale rather than defining its own, and only adds
`course-*` for things workshops do not have (the module list, the ladder). That
is a reasonable choice, but it means the course page inherits every quirk in
`Workshop.css`, including the ones listed under Traps below. When editing that
page, read `Workshop.css`, not just `course-sales.css`.

## Workflow

1. **Identify the page and its namespace** from the table above.
2. **Pick the section pattern** from
   [references/section-patterns.md](references/section-patterns.md). Do not
   invent a layout. Nine patterns cover every section on the site.
3. **Copy the reference markup** for that pattern, then swap the classes to the
   page's own prefix if it has one.
4. **Run the pre-ship checklist** at the bottom of this file.

When the user reports something that "looks off" without naming a cause, work
the Traps table first. Six of the seven entries there are things that look like
a spacing bug and are actually a wrong class.

## Traps

Every one of these has bitten this codebase. They are ordered by how often.

### 1. Wrapper classes that look like heading classes

`workshop-topics__head` is a **wrapper div** with nothing but
`margin-bottom: 18px`. The heading is `workshop-topics__title`. Put the wrapper
class on the `<h2>` and it silently loses its top margin, its
`clamp(40px, 4.6vw, 72px)` size and its `22ch` wrap width, and the gap under the
kicker collapses.

Same shape: `workshop-framework__head-wrap` wraps, `workshop-framework__head` is
the heading.

**Before using any `__head` class, grep its rule.** If it only sets margins, it
is a wrapper.

### 2. Mixing container widths breaks the left rail

`.container` is 1320px, `.container--narrow` is 980px, and both are centred with
`margin: 0 auto`. A narrow section's left edge therefore sits about 170px right
of a wide one, and the page loses its shared left rail.

**The rule the codebase actually follows:** `container--narrow` is only used on
sections whose content is centred, where there is no left rail to break. Every
such use is paired with `text-align: center`:

- `Landing.css` `.cta__inner`
- `SpringCalculatorLanding.css` `.springs101-signup .container`
- `Workshop.css` `.workshop-cta`

**The one exception is a bug, not a pattern.** The PP101 and PP102 FAQ sections
use `container--narrow` while left-aligned, and they do visibly indent against
the sections around them. Do not copy that.

So: centred section, narrow container is fine. Left-aligned section, use the
default container.

### 3. Prose-only sections read as broken

Body copy caps between 56ch and 64ch everywhere in the system. Inside the 1320px
container that fills about 43% of the width, so a section that is only a heading
and a paragraph looks like a rendering failure, especially with another one
directly beneath it.

The fix is never to widen the prose. It is to give the section a second column
(see the bio and details patterns) or to make sure two of them never sit
adjacent.

### 4. Heading sizes are not uniform

Most section heads cap at 72px. Two cap at 64px: `workshop-why__head` and
`workshop-details__head`. Pick the wrong one and the headline wraps differently
from its neighbours for no visible reason. Check the size table in the
patterns reference before choosing.

### 5. Hero background images are a CSS variable, not a class

`.workshop-hero` resolves
`var(--workshop-hero-image, url('/images/homepage/workshop-hero-image.JPG'))`.
Omit the override and the page silently inherits the shared workshop photo,
which looks deliberate and is not. Set it inline on the section:

```jsx
<section
  className="workshop-hero section-frame"
  style={{ '--workshop-hero-image': "url('/images/homepage/hero-image-5.jpg')" }}
>
```

### 6. Anchor targets need scroll margin

A sticky nav covers the top of any element scrolled to by an `href="#id"`.
`workshop-details__register` carries `scroll-margin-top: 5rem` in CSS, so put
the id on that panel rather than on the section. Where no class carries it,
`SpringCalculatorLanding.jsx` sets `style={{ scrollMarginTop: '5rem' }}` inline.
Either is fine. Forgetting both is not.

### 7. Breakpoint drift

The system has two breakpoints, `1100px` (two-column grids collapse to one) and
`700px`. Anything else is drift. `course-sales.css` currently carries `860px`
and `560px`, and there are stray `960px`, `900px` and `760px` rules elsewhere.
When adding a grid, collapse it at 1100px with the others.

## Conventions that are easy to get wrong

- **Sections are numbered `§ NN` in the kicker, sequentially, with no gaps.**
  Remove a section and renumber the ones after it. A skipped number reads as a
  bug on a page where every section is numbered.
- **Durations render as "2 hours", "1 hour".** Not "about an hour", not "1 hr".
  See the PP101 and PP102 spec lists.
- **Module numbering starts at 01.** `ModuleList.jsx` in the portal renders
  `index + 1`, so a sales page listing modules from 00 contradicts what the
  buyer sees after purchase. `sort_order` is an internal key, never display.
- **Never hardcode a price in `CourseSalesBody`.** That body is shared with the
  offer plan's discounted window, so a hardcoded number contradicts the pricing
  card beside it. The card owns the price in every variant.
- **`FIG. NN` tags are for genuine figures only,** portraits, charts, diagrams.
  Not every image.
- **Delete orphaned CSS in the same change.** Removing an element and leaving
  its rule behind is how these stylesheets accumulated the drift above.

## Pre-ship checklist

Run this against any page you have touched.

- [ ] Every section uses the same container, unless a narrow one is centred
- [ ] Every `<h2>` uses a real heading class, not a wrapper class
- [ ] Heading sizes are consistent, or differ on purpose
- [ ] No two prose-only sections sit adjacent
- [ ] `§ NN` kickers run sequentially with no gaps
- [ ] Anchor targets carry `scroll-margin-top`
- [ ] New grids collapse at 1100px
- [ ] Hero sets `--workshop-hero-image` if it should not inherit the default
- [ ] Orphaned CSS rules removed
- [ ] `npm run build` and `npx eslint` both pass

Verify by reading the CSS rules you are relying on, not by assuming from the
class name. Every trap above is a name that reads as one thing and does another.
