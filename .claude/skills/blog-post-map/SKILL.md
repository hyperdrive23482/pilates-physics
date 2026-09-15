---
name: blog-post-map
description: >-
  Map a blog post as an editable flowchart of blocks, published as an Artifact,
  then rewrite the post's prose to match whatever structure comes back. Use when
  the user wants to see the shape of a post rather than read it: "map this post",
  "show me the structure", "make a block diagram of the blog post", "where are the
  dead ends", "I want to move these sections around", "does this post flow". Also
  use to close the loop afterwards: "the map is ready", "I've edited the map",
  "rebuild the post from the map". The map is structure only. Labels, summaries,
  order, depth and threads live in the artifact; the prose stays in the post and
  gets rewritten from here.
---

# Blog post structure map

Long posts fail structurally long before they fail sentence by sentence. A
thread gets opened and never closed, a section gets credited and then abandoned,
two sections make the same move. None of that is visible while reading, because
reading is linear and the problem is shaped.

This skill turns a post into a diagram you can rearrange, and then turns the
rearranged diagram back into the post.

**Structure only.** The artifact holds block labels, one-line summaries, order,
depth and thread tags. It never holds the prose. The prose lives in the post and
is rewritten from the map on the way back. Do not put paragraphs into the
artifact, and do not let the user think editing a label edits the post.

## The loop

```
post  →  blocks  →  artifact (user edits)  →  read back  →  rewrite prose  →  post
```

Two separate invocations. Going out is "map this post". Coming back is "the map
is ready". Never rewrite the post in the same turn as publishing the map.

---

## Step 1. Source the post

In order of preference:

| Where | How |
|---|---|
| Local draft | `docs/blog-drafts/<slug>.md` — strip the leading HTML comment |
| Prod (live copy) | Supabase MCP, project `vvoceaaelejovohhqjsu`, `select body_markdown from blog_posts where slug = '<slug>'` |
| Dev | same query, project `ngbwyarbxnyfmdeyvlsd` |

Prod is the source of truth for anything published. The local draft goes stale
fast, so if both exist and differ, say so and ask which one to map. See
[project_blog_post_db_workflow] in memory for how posts get into the CMS.

## Step 2. Derive the blocks

Read the whole post first. Then cut it into blocks.

**Depth 0** is a section, almost always an `###` heading, plus one depth-0 block
for the front matter above the first heading.

**Depth 1** is a move inside that section: a distinct argument beat, usually two
to five paragraphs, or one of the bolded run-in beats.

**Depth 2** is a supporting element under a move: an example, a statistic, a
link out to another post, a caveat.

Rules that keep maps comparable between posts:

- A block is a **move**, not a paragraph. If two paragraphs do one job, that is
  one block.
- The label is what the block **does**, in the author's words where possible.
  "Panel said personalization, no one said how" beats "Introduction".
- The summary is one line on why the block exists. If you cannot write it, the
  block probably is not a block.
- Set `anchor` to the heading or the first six words of the block's first
  paragraph, so the rewrite can find it again. Front matter blocks have an empty
  anchor, which is what makes the map number them 0.x.
- Never exceed depth 2. If something needs depth 3, the parent is too big.

## Step 3. Tag the threads

This is the part that earns the diagram. A **thread** is a promise the post
makes to the reader that something later will pay off.

- `opens` — this block raises a question, names a gap, makes a claim the reader
  expects to be settled, or credits something the argument will use later.
- `closes` — this block settles it.

Give each thread a short lowercase name and use it consistently. Tag
conservatively: five to nine threads in a 2,000 word post. Tagging every
sentence makes the report useless.

The artifact then computes:

| Verdict | Meaning | What it usually means for the post |
|---|---|---|
| resolves | opened, then closed later | fine |
| dead end | opened, never closed (or closed before it opens) | cut the setup, or add the payoff |
| closed, never opened | payoff with no setup | the reader has no reason to care yet |

Dead ends are the whole point of the map. Do not soften them. When you present
the published map, name the dead ends in the chat message too, since the user
may not scroll.

## Step 4. Build and publish

1. Copy `references/map-template.html` to the scratchpad directory.
2. Replace `__TITLE__` (post title, short form is fine), `__SLUG__` (both
   occurrences), and `/*__BLOCKS__*/[]` with the blocks array as JSON.
3. Publish with the Artifact tool:
   - `capabilities: {db: {}}` — required, this is how edits come back
   - `favicon` on first publish only
   - `description`: one sentence naming the post
   - Same file path on every republish of the same post, so the URL is stable
4. Seed the store so the artifact and the database agree from the start:
   `write_db`, `db_op: "set"`, `collection: "maps"`, `doc_id: <slug>`,
   `data: {slug, blocks, updatedAt}`.

Do not hardcode a seed write inside the page. The page renders the embedded
blocks at rest and the store is seeded from the tool.

Record the artifact URL in the post's local draft header comment so the next
session can find it.

### How the map behaves, so you can explain it

- **Blocks drag by the grip** in the left gutter, not by the body, because the
  labels are contenteditable and the two gestures would fight. An amber line
  shows where the block will land.
- **A block owns everything below it that is deeper.** Dragging a depth-0
  section carries its beats; dragging a depth-1 move carries its examples.
  Indent and outdent carry the subtree too.
- **Depth is normalized after every move.** No block may sit more than one level
  deeper than the block above it, so dragging a nested block to the top of the
  post promotes it rather than producing numbering that means nothing. Say so if
  a drag changed a depth the user did not set.
- **Arrow buttons move by one sibling** and do the same subtree move. They are
  the touchscreen path and the keyboard path, since HTML5 drag does neither.

## Step 5. Read the map back

When the user says the map is ready:

1. `read_db`, `db_op: "get"`, `collection: "maps"`, `doc_id: <slug>`.
2. Diff it against the blocks you published. Report the changes in plain terms
   before touching the post: what moved, what got cut, what is new, what got
   relabelled.
3. Only then rewrite.

If the store has no document, the user edited a view without db access and
nothing was saved. Say that plainly and ask them to re-open the artifact.

## Step 6. Rewrite the post to match

The map is the new outline. The post is rewritten to it, not patched toward it.

| In the map | In the post |
|---|---|
| Block unchanged | Keep its prose verbatim. Do not improve it unasked. |
| Block relabelled | Keep the prose, adjust only what the new label changes. |
| Blocks reordered | Move the prose with the block, then rewrite the transitions at both the old and new seams. |
| Block depth changed | Promote or demote the heading, and adjust how much the block explains itself. |
| Block marked `cut` | Remove the prose. Then check every thread it opened or closed. |
| Block `new` with a label | Write new prose in voice, matching the surrounding block lengths. |

**The seams are the work.** Moving a block is easy; the sentences that used to
hand off to it are the thing that breaks. After any reorder or cut, reread the
paragraph before and after every seam and rewrite the transitions.

**Then re-derive the threads from the rewritten prose** and compare to the map.
If the rewrite introduced a dead end, fix it before handing back.

Always run the result against
[voice-and-messaging.md](../../../docs/marketing/voice-and-messaging.md). The
rules that break most often in a structural rewrite: no em dashes, sentence case
headings, punch up never across, and do not bury the why.

Write the result to the local draft file first. Pushing to prod is a separate,
explicit step the user asks for.

## Notes

- The artifact is single-theme dark on purpose, using the v2 tokens from
  [design-system.md](../../../docs/design-system.md). It is an internal tool for
  a dark-ground brand, not a page for readers.
- One artifact per post. Republishing to the same file path keeps the URL and
  the store.
- The store survives republishing, so you can improve the template without
  losing the user's edits.
