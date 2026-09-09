---
name: page-framework-audit
description: >-
  Audit a landing page or website against the Pilates Physics marketing
  frameworks (the positioning reframe, PEACE, StoryBrand page structure, and the
  voice guide), then produce an editable section-by-section redraft the user can
  mark up and iterate on. Use this whenever the user wants to review, audit,
  critique, or rework the copy or layout of a page (homepage, landing page,
  workshop sales page, Springs 101 page, About, etc.) to fit the frameworks,
  even if they only say "does this page fit my positioning?", "review the
  homepage", "rework this landing page", or "make this match PEACE / StoryBrand".
  Also use when the user says "re-write with our choices" to regenerate an
  in-progress redraft file from this workflow.
---

# Page framework audit

Audit a page against the Pilates Physics marketing frameworks and hand the user
a clean, editable redraft they can comment on line by line. The point is a tight
back-and-forth: you produce a structured markdown draft, the user writes notes in
per-section commentary blocks, you discuss each section in chat, and when they
say "re-write with our choices" you regenerate the draft with the agreed changes.

The user is the decision-maker on copy. Your job is to apply the frameworks,
surface where the page drifts from them, and propose concrete copy. Never present
the redraft as final or ship it to the site. It is a working document.

## The frameworks (read these first, every time)

The four source-of-truth docs live in `docs/marketing/`. Read the ones relevant
to the page before auditing. Do not audit from memory. They are authoritative and
can change, so re-read rather than relying on what you recall.

| File | What it governs |
| --- | --- |
| [peace-framework.md](../../../docs/marketing/peace-framework.md) | The PEACE beats (Problem, Empathy, Answer, Change, End Result), the master soundbites, the controlling idea, and where each beat is deployed |
| [website-structure.md](../../../docs/marketing/website-structure.md) | The StoryBrand section order, the grunt test, the two-CTA funnel rule, the five mistakes, and the quick audit checklist |
| [voice-and-messaging.md](../../../docs/marketing/voice-and-messaging.md) | Voice traits and hard copy rules. **No em dashes, sentence-case headings, no exclamation marks, one italic-accent phrase per heading.** This file wins over the design system on copy |
| [customer-language.md](../../../docs/marketing/customer-language.md) | Real student words to pull from instead of inventing phrases |

Supporting context when useful: `icp-profiles.md` (who the page speaks to) and
`soundbite-principles.md` (the theory behind the beats).

**The positioning north star**, from the top of the PEACE file: physics is the
engine, not the product. The promise is personalization (build the class around
the body in front of the instructor). Sell the personalization, prove it with the
physics. Every audit judgment ladders up to this. A page that sells "learn the
physics" as the product has drifted, even if every other box is checked.

## Workflow

This skill runs a loop. Figure out where the user is and pick up there.

1. **Locate the page.** Find the source file for the page under review (usually
   `src/pages/<Name>.jsx`, plus its component and CSS). Read the actual rendered
   copy, not just the file name. If it is ambiguous which page they mean, ask.
2. **Audit** against the frameworks (see "How to audit").
3. **Produce the redraft file** in the scratchpad (see "The redraft file"). This
   is the deliverable, not a chat summary.
4. **Discuss** with the user section by section as they add commentary.
5. **Re-write** the file with agreed choices when they say so, and loop.

### 1. Locate the page

Pages are React under `src/pages/`. The homepage is `Landing.jsx`; other common
targets are `Springs101Landing.jsx`, `WorkshopSalesPage.jsx`, `About.jsx`,
`PilatesPhysics101.jsx`. Read the page component and any section subcomponents so
you audit the copy that actually renders, including the nav (`Navbar.jsx`) when
CTAs or link count are in scope.

### 2. How to audit

Judge the page on three lenses at once. Do not treat them as separate passes,
because they interact (a section can be structurally present but say the wrong
beat).

- **Positioning.** Does the page sell personalization proven by physics, or does
  it sell physics as the product? Look for the promise language ("the body in
  front of you", "personalize", "built for their body"). Its absence is the most
  common and most important miss.
- **PEACE.** Map each section to a beat. Is the Problem beat leading the hero? Is
  Empathy honoring the training rather than implying it failed? Does the page
  close on the End Result? Flag missing beats (Stakes/Problem-escalated and End
  Result are the usual gaps) and misplaced ones.
- **StoryBrand structure.** Walk the canonical section order in
  website-structure.md: Hero, Stakes, Value, Guide (empathy then authority),
  Plan, Explanatory paragraph, transitional CTA, footer. Note missing sections,
  the grunt test on the hero, whether **both** CTAs are present (Springs 101
  transitional + workshop registration direct), nav link count (five max), and
  the five mistakes, especially "the brand is the hero."
- **Voice.** Catch hard-rule violations directly in the copy: em dashes,
  title-case headings, exclamation marks, two accent phrases in one heading,
  buried "why", jargon without a plain-language gloss.

**Always run the headline scan test** (defined in website-structure.md). Extract
every section headline in page order, hero first, and read that list on its own,
ignoring all body copy. It is what a skimmer actually consumes, so it has to work
as a standalone story. Flag two things:

- **Dead beats:** a headline that names the *format* of its section rather than
  making its *claim*. "Three components" is a dead beat; "The missing piece isn't
  your choreography. It's the load." is the same section making an argument.
  Propose a replacement for every dead beat.
- **Repeated construction:** four headlines sharing one sentence shape reads as a
  tic rather than a build. Name it and suggest which one to recast.

Put the extracted headline list in the redraft file so the user can run the scan
themselves. This catches problems that a section-by-section read misses, because
a headline can look fine sitting above its own body copy and still say nothing to
someone scrolling past.

Ground every finding in a quote from the page and name the framework it comes
from, so the user can see the reasoning, not just the verdict.

### 3. The redraft file

Write the redraft to the session scratchpad directory as
`<page>-redraft.md` (for the homepage, `homepage-redraft.md`). This file is the
product. Tell the user the path.

Structure it exactly like the template in
[references/redraft-template.md](references/redraft-template.md). Read that file
and follow it. The essential, non-negotiable parts:

- A short header stating this is a draft, nothing is applied to the site, and the
  voice rules the copy follows.
- A `_Last updated: YYYY-MM-DD_` line just under the title, using today's date.
  Refresh it every time you regenerate the file so the user can tell which pass
  they are looking at.
- A one-line positioning north star.
- A **section map table** (`# · Section · StoryBrand beat · PEACE beat · Status
  vs today`) so the user sees the whole shape at a glance.
- A **Headline scan** block listing the proposed headlines in page order, so the
  user can run the skim test on the draft in one read. Note any dead beat or
  repeated construction underneath it.
- One block per section, in page order, each with: the section name and its
  italic-accent one-liner, the proposed copy (headline, sub-head, body, CTAs as
  applicable), a short **Why** tying the change to a framework, and status tags
  like **[NEW]** / **[reworked]** / keep.
- A **"Kaleen's Commentary:"** block at the end of every section. This is where
  the user writes notes back to you. Include it even when you have no changes to
  propose for that section, because the user may still want to comment. Leave it
  empty (just the bold label) for the user to fill.
- Any genuinely open decision called out explicitly at the end, with a place to
  mark the choice.

Write real, on-voice copy, not placeholders. Pull phrasing from
customer-language.md where it fits. Obey every voice rule inside the proposed
copy itself: no em dashes, sentence-case headings, no exclamation marks, exactly
one italic-accent phrase per heading (mark it with *asterisks*).

### 4. Discuss section by section

When the user hands the file back with commentary filled in, respond in chat, not
by silently editing. Go section by section in order. For each section that has
commentary:

- Restate what they asked for in one line so they know you understood.
- Give your take: agree, or push back with a framework reason if their note works
  against a beat or a voice rule. You are the framework expert in the room, so
  say when something drifts, but it is their brand and their call.
- Where they asked for new copy, draft it inline so they can react before it
  lands in the file.
- Flag any typos or voice violations you noticed in their edits (for example an
  em dash they reintroduced, an exclamation mark, all-caps hype like "FREE").

Keep it tight and skimmable. Collect open decisions into a short list at the end
so nothing gets lost. Do not regenerate the file yet.

### 5. Re-write with our choices

When the user says "re-write with our choices" (or similar), regenerate the
redraft file in the same format, folding in every agreed change:

- Apply the copy you and the user settled on in discussion.
- Fix flagged typos and voice violations.
- Keep the user's own wording where they wrote it, unless it breaks a rule, in
  which case apply the fix you discussed.
- Reset each **"Kaleen's Commentary:"** block to empty so the next pass is clean,
  unless the user asked to keep a note as an open thread.
- Resolve or update the open-decisions list based on what they chose.

Then tell the user what changed at a high level and hand back the path. The loop
can repeat as many times as needed. Only touch the actual site code (the `.jsx`
files) if the user explicitly asks you to implement the redraft; the default
deliverable is the markdown file.

## Notes on judgment

- The frameworks are guides, not fill-in-the-blank forms. Mistake #4 in
  website-structure.md is following them too literally. If a section does not fit
  a page's job, say so rather than forcing it.
- The registration-versus-lead-magnet question (which CTA leads) depends on the
  page's traffic and whether a cohort is open. Surface it as a decision rather
  than assuming, and remember the rule that both CTAs always appear, only the
  visual weight changes.
- The single most valuable thing you can catch is the positioning drift: a page
  that reads as "learn physics" instead of "personalize class for every body,
  powered by physics." Lead the audit with that when it is present.
