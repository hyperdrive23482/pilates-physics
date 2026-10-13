---
name: reel-brain
description: Turn Kaleen's posted reels and carousels into Brain entries. Scans the Google Drive drop folder "BRAIN - Reels and Carousels", transcribes each reel (speech plus on-screen text) or reads each carousel slide, uploads it to the Brain (Supabase brain_entries) and mirrors it to docs/brain/, then renames the original and files it in done/. Runs daily at 6pm as a scheduled task. Use when the user says "process my reels", "check the reel folder", "add this reel/carousel to the brain", "refresh the brain mirror", or asks where the brain or reel transcripts live.
---

# Reel brain

**Where things live**

- Drop folder: `G:\My Drive\Pilates Physics Content\BRAIN - Reels and Carousels`. A reel is a `.mp4`/`.mov`. A carousel is a subfolder of images. Processed items go to `done/` inside it.
- The Brain is `brain_entries` in the **prod** Supabase project, shown at `/admin/content/brain`. Entries that are switched on get injected into the content drafting prompt (`api/_lib/anthropic.js`).
- `docs/brain/` in this repo is a read-only mirror of every entry (transcripts, personas, blog posts, style guides), plus `INDEX.md`. Supabase is the source of truth: never edit mirror files by hand. Edit in the admin, then pull.
- Reads and writes go through `api/admin/content/brain-ingest.js`, using `BRAIN_INGEST_URL` and `BRAIN_INGEST_SECRET` from the repo `.env`.

**Commands** (run from the repo root, in Bash):

```bash
PY="$HOME/.claude/skills/session-transcripts/.venv/Scripts/python.exe"
S=".claude/skills/reel-brain/scripts"
"$PY" "$S/brain_sync.py" pull                  # refresh docs/brain/ from Supabase
"$PY" "$S/reel_brain.py" scan                  # list new items as JSON
"$PY" "$S/reel_brain.py" prepare "<item>"      # transcript + contact sheets / slides
"$PY" "$S/brain_sync.py" push entry.json       # upsert, then pull
"$PY" "$S/reel_brain.py" finalize "<item>" --date D --kind reel --slug S --md docs/brain/transcripts/<file>.md
```

## The run

1. **Pull** first, every run, even when nothing is new. That keeps the mirror in step with admin edits and on/off toggles. If pull fails (endpoint down, secret missing), stop and report it. Do not touch the drop folder.
2. **Scan.** Nothing in `items` means you're done; report "no new reels or carousels". Items in `still_syncing` were changed in the last 15 minutes and are left for the next run.
3. For each item, one at a time:
   1. **Prepare.** Run reels in the background: Whisper runs at about 8x real time, and a 3-minute reel takes about 30 s plus model load.
   2. **Read everything.**
      - Reel: read the `.transcript.txt`, then view **every** contact sheet. Many reels are built in Edits with text overlays, or with music and no speech, so the overlays often *are* the content.
      - Carousel: view every slide in order.
      - If there's a `caption_file`, read it. It holds the Instagram caption, and a URL inside it becomes `source_url`.
   3. **Name it.**
      - Subject: 2 to 5 words in Title Case, taken from the content. `subject_hint` (from the filename) is only a hint.
      - Slug: kebab-case of the subject.
      - Date: use `date` from scan (a typed `YYYY-MM-DD` filename prefix beats the Edits export stamp, which beats the file date).
      - Title: `<Subject> (Reel, YYYY-MM-DD)` or `<Subject> (Carousel, YYYY-MM-DD)`. That exact pattern drives the mirror filename `YYYY-MM-DD_reel_<slug>.md`.
      - Check `docs/brain/INDEX.md`. If the same title already exists for a *different* post, add ` Part 2`. Pushing an identical title updates that entry instead of adding a new one.
   4. **Write `entry.json`** in the scratchpad: `{"type": "transcript", "title": ..., "content": ..., "source_url": null}`. Leave out `is_active`: new entries default to off, and a re-push won't flip an entry you switched on. Content format:

      ```
      **Format:** Reel · **Posted:** 2026-10-13
      **Topic:** <one or two sentences on what the post teaches>
      **Key concepts:** <comma-separated physics/Pilates terms, for search>

      ## Spoken
      <the transcript as clean prose paragraphs, no timestamps>

      ## On-screen text
      <overlay text in order, deduplicated across frames. Skip burned-in captions
       that just repeat the speech. Keep titles, labels and tables (e.g. a
       Body / Springs / Friction energy table), and note what drawn diagrams show.>

      ## Caption
      <Instagram caption, only if a caption file was given>
      ```

      - Carousel: replace both middle sections with `## Slides`. Number the slides, give each its text verbatim, and add `[visual: ...]` for a diagram or photo that carries meaning.
      - Drop a section that would be empty. A silent reel has no `## Spoken`.
      - Transcript fixes: correct obvious Whisper mishearings of Pilates or physics terms (it knows Kaleen's vocabulary from the brand context). Mark anything you're unsure of with `[?]`. Otherwise keep her words; don't summarize or polish them.
      - No em dashes in anything you write (Topic, Key concepts, visual notes).
   5. **Push.** Its output prints the mirror path. If the push fails, stop on that item and leave it where it is so the next run retries it.
   6. **Finalize** with the same date, kind and slug, and `--md` pointing at the mirror file. It moves the original (plus `.srt` and caption) into `done/` as `<date>_<kind>_<slug>.*`, copies the `.md` beside it, and deletes the transcriber's leftover `.transcript.txt/.json`.
4. **Report** one line per item: title, kind, length or slide count, and anything you flagged. Mention that new entries are **off** until switched on in `/admin/content/brain`. Never commit. The `docs/brain/` changes stay uncommitted for Kaleen to review.

## Using the Brain for other work

For a blog post, course, social post or email on a topic, grep `docs/brain/` (start with `INDEX.md`) for past reels, carousels and posts that cover it. Quote Kaleen's own phrasing from them, and say which entry it came from.
