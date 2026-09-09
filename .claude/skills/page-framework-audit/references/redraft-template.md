# Redraft file template

This is the shape every redraft file follows. It is a working document the user
marks up, not a final spec. Copy this structure, fill it with real on-voice copy
for the page under review, and adapt the section list to the page's actual
sections. Sections in `{curly braces}` are instructions to you, not literal text.

Voice rules apply to all proposed copy: no em dashes, sentence-case headings, no
exclamation marks, exactly one italic-accent phrase per heading (marked with
*asterisks*). Pull phrasing from `docs/marketing/customer-language.md` where it
fits.

---

```markdown
# {Page name} redraft — proposed layout + copy

_Last updated: {YYYY-MM-DD}_

> Draft for review. Nothing is applied to the site. Edit inline, strike what you
> don't like, and hand it back. Copy follows the voice rules: no em dashes,
> sentence-case headings, no exclamation marks, one italic-accent phrase per
> heading (marked with *italics* below).

**Positioning north star for every line below:** sell the *personalization*
(build class around the body in front of you), prove it with the *physics*.
Physics is the engine, not the product.

{If the page has a genuinely open framing decision, e.g. registration-led vs
lead-magnet-led, state the assumption you drafted under here in one short
paragraph, and point to the decision block at the bottom.}

---

## Section map at a glance

| # | Section | StoryBrand beat | PEACE beat | Status vs today |
|---|---------|-----------------|-----------|-----------------|
| 1 | {Hero} | {Header} | {Problem + Answer} | {Rewrite} |
| 2 | {Stakes} | {Stakes} | {Problem escalated} | {**New**} |
| … | … | … | … | … |
| — | Nav | nav CTA | — | {change or keep} |

---

## Headline scan

{The skim test: read only the headlines, in order, and confirm they tell the
story with no dead beats. List every proposed headline in page order, hero
first, as a blockquote. Then note any dead beat (a headline naming its section's
format rather than making its claim) or repeated sentence construction.}

**Kaleen's Commentary:**

---

## 1. {Section name}  — *{italic-accent one-liner}*  {[NEW] / [reworked] / (keep)}

{Optional one-line note on what this section is doing.}

**{Field label, e.g. Headline}:**
> {Proposed copy. Real copy, on voice, not a placeholder.}

**{Sub-headline / Body / Value items / Steps / CTAs as the section needs}:**
> {Proposed copy.}

**Primary CTA:** `{Register Now →}`
**Transitional CTA:** `{Or start free with Springs 101}`

**Why:** {One or two sentences tying the change to a specific framework beat or
voice rule, so the user sees the reasoning.}

**Kaleen's Commentary:**

{Leave this blank for the user to fill. Keep the bold label on every section,
even ones with no proposed change, so the user always has a place to comment.}

---

## 2. {Next section}  …

{Repeat the per-section block for every section of the page, in page order.}

---

## Nav change (if in scope)

{Bullet the nav CTA / link-count recommendations. Include a Kaleen's Commentary
block here too if nav is under discussion.}

**Kaleen's Commentary:**

---

## Open decisions

{List any genuinely open choices that need the user, each with a place to mark
the answer. Example:}

The page is drafted **registration-led**. If most traffic is cold or no cohort is
open, flip to **lead-magnet-led** (Springs 101 gets the visual weight, Register
stays present but secondary). No copy changes needed beyond button emphasis.

Mark your choice here → [ ] registration-led   [ ] lead-magnet-led
```

---

## Why the format is shaped this way

- **Section map table up top** lets the user grasp the whole restructure before
  reading any copy. It also makes missing sections (Stakes, Plan, End Result
  close) visible at a glance.
- **Per-section Why** keeps the audit reasoning attached to each proposal, so the
  user is deciding with the framework in view, not just reacting to copy they
  like or dislike.
- **Kaleen's Commentary blocks** are the interface for the loop. They give the
  user one obvious place per section to write back, and they let you respond
  section by section in chat without hunting for scattered notes.
- **Open decisions block** prevents the biggest framing choice (which CTA leads)
  from being silently assumed. It surfaces as a checkbox the user resolves.
