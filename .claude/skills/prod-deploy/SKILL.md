---
name: prod-deploy
description: Work out what has changed on dev since it was last merged to main, and build the runbook for shipping it to production. Produces the copy-pasteable command blocks plus every manual step the CLI cannot do, covering which migrations db push will actually apply, which API routes changed (including the ones pulled in by an api/_lib edit), which Vercel env vars are new or environment-specific, and which dashboard changes are needed for Stripe, Supabase Auth templates and crons, with verification SQL. Use whenever the user asks what has changed on dev, what is waiting to ship, or is about to merge dev into main, push to prod, or deploy to production.
---

# Prod deploy runbook

Two jobs, and the first is often the whole request: **say what has changed on dev since main**, and **produce a specific, complete, copy-pasteable runbook for shipping it**. If the user only asked what changed, answer that and offer the runbook rather than dumping the whole thing.

Never run the deploy commands yourself. The user runs them. You produce the blocks and read the output they paste back. Do not commit or push anything either.

## The two environments

| | Supabase project | deploys how |
|---|---|---|
| **staging** | `ngbwyarbxnyfmdeyvlsd` | `dev` branch, `stage.pilatesphysics.com`. Vercel builds on push. |
| **prod** | `vvoceaaelejovohhqjsu` | `main` branch, `pilatesphysics.com`. Vercel builds on push. |

The Supabase CLI acts on **whichever project is linked** (`supabase/.temp/project-ref`, gitignored). The whole deploy is "link prod, do things, link staging back". Forgetting the relink is the single most expensive mistake available here: the next stray `db push` lands on prod. Always end the runbook with the relink and call it out in prose too.

There is no separate frontend deploy step. Vercel's Git integration builds Production from `main`, so **the push is the deploy**. There is nothing to promote and no function-by-function deploy: every route in `api/` is rebuilt and redeployed from the same push.

## Step 1 — Run the analyzer

```
node .claude/skills/prod-deploy/deploy-plan.mjs
```

It fetches, diffs `origin/main...origin/dev`, and prints: the commit list, migrations, changed API routes with their `_lib` blast radius, Vercel env deltas, `vercel.json` cron and `includeFiles` changes, ready-made command blocks, and verification SQL. Flags: `--base <ref>` / `--head <ref>` to override, `--no-fetch` to skip the network.

Its output is *input to you*, not the deliverable. Read every section, then do step 2 before writing anything.

## Step 2 — Do the judgment the script cannot

The script finds facts. These need you to open files:

1. **Read every new migration.** Only reading tells you whether the change is additive (safe to apply before the frontend ships) or breaking (a dropped column, a tightened constraint, a renamed function). Breaking changes need the migration and the frontend to land close together, and the runbook should say so out loud.
2. **Read every seed migration properly.** This repo ships content through migrations: workshops, blog posts, tool rows. Those rows carry `stripe_price_id`, `kit_tag`, and storage paths, all of which are **environment-specific**. A workshop seeded with a staging test price id will take real money to a dead price on prod. The script flags which tables get seeded; you have to read what is in the rows.
3. **Check the real migration delta, not the diff.** See the hazard section below. The analyzer says this too, but it is the thing most likely to go wrong, so put it in the runbook as its own step rather than a footnote.
4. **Decide whether env values differ on prod.** Same name, different value, is the normal case for anything live-vs-test: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, the Supabase URL and keys (different project entirely), `SITE_BASE_URL`. If a changed route touches one of these, say explicitly that prod needs the **live** value, not a copy of staging's.
5. **Check for Stripe and other external dashboard config.** A new or renamed webhook route needs its endpoint registered in the external dashboard against the **prod** URL, and `STRIPE_WEBHOOK_SECRET` must match that endpoint's signing secret rather than staging's. The script cannot see any of this.
6. **Check whether Supabase Auth email templates changed.** Files under `supabase/email-templates/` ship with the build, but the templates configured in the Supabase dashboard are per-project and set by hand. Changing them on staging does nothing for prod.

## Step 3 — Write the runbook

Structure it exactly like this, and cut any section that has nothing in it. Do not pad. A short runbook is the good outcome.

**A. What's shipping** — one or two sentences: commit count and the headline of what changes for users. Then the flags: dirty working tree, non-fast-forward, migrations modified after the fact. Lead with these if any are present.

**B. Before you start** — anything that must be true or acquired first: a value for a new secret, a Vercel variable added, an external dashboard change. Build-time `VITE_*` variables belong here, not later: they are inlined into the bundle at build time, so they must exist in Vercel Production **before** `main` is pushed.

**C. The commands**, one fenced `bash` block per phase, in this order. Each block gets a one-line heading above it saying what it does and what to look for.

1. Preflight — `npm run lint` and `npm run build`. There is no CI in this repo, so these are the only gate.
2. Link prod, then `supabase migration list`, and **stop there** for the user to read the delta back to you. Then `db push --dry-run`, then `db push`.
3. Merge `dev` into `main` and push. This is the frontend and API deploy; nothing else to run.
4. Relink staging.

Keep it PowerShell-safe: one command per line, no `&&`, no backslash continuations. Do not collapse phases, since the user verifies between them.

**D. Manual, in the dashboard** — a numbered list, each item saying *where* (Supabase SQL editor, Vercel → Settings → Environment Variables → Production, Stripe dashboard, Supabase → Authentication → Email Templates) and *what*, with the exact SQL or variable name. Placeholders for secret values, never real ones.

**E. Verification** — the SQL from the analyzer with its expected row counts, plus a short smoke list: what to click on prod, which function logs to check, which cron to watch for its first successful run.

**F. If something goes wrong** — only the failures that actually apply to this deploy.

## Things that are easy to get wrong

- **`db push` does not push "the diff". It pushes everything the linked project is missing.** prod and staging drift constantly here: a migration pushed to staging from a feature branch never reached prod, and a branch may be carrying a migration file purely so staging's history validates. Linking prod and running `supabase db push` blind can therefore apply migrations nobody intended to ship. `supabase migration list` after linking prod is the only real answer. Make it a step the user reports back on before anything is pushed.
- **A missing local file blocks the push entirely.** If the linked project has a version with no local file, the CLI refuses with "Remote migration versions not found in local migrations directory" and suggests `supabase migration repair --status reverted <version>`. That suggestion is usually **wrong**: if the objects really exist in that database, marking the version reverted makes a later push try to create them again. The fix is to bring the migration file onto the branch so local history matches.
- **Order is migrations, then frontend.** The API and the frontend deploy together from one push, so a schema change has to be applied first or live traffic hits new code against the old schema.
- **`api/_lib` edits are invisible in the route list.** A one-line change in `_lib/supabase-admin.js` changes the behaviour of every route importing it. The script resolves this transitively; use its output rather than hand-picking from the diff.
- **Env vars are per-project and per-scope.** Nothing about staging's Vercel variables implies Production has them. Check the Production scope specifically, not Preview.
- **`VITE_*` is baked in at build time.** Adding one to Vercel after the push does nothing until the next build.
- **A route that reads from disk needs a `vercel.json` `includeFiles` entry.** Without it the file is not bundled and the read fails only at runtime, in production, on a code path that worked locally. The analyzer checks for this.
- **Never print a real secret value.** Not in the runbook, not in a command, not in SQL. Placeholders only.
- **`npm run build` does not typecheck.** This repo has no typecheck script. `npm run lint` plus a successful build is the whole safety net, and it is thinner than it looks.

## After the user reports back

If they paste `supabase migration list`, read the delta and tell them exactly which versions are about to apply and whether any of them should not be. If they paste an error, diagnose it against the migration or route in question. If they say it is done, offer the verification SQL and the smoke list again as the closing step, and confirm the relink to staging actually happened.
