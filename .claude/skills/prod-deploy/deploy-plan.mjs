#!/usr/bin/env node
/**
 * Prod deploy plan — what changed between prod (main) and dev, and what of
 * that Vercel and the Supabase CLI cannot do for themselves.
 *
 * Usage:
 *   node .claude/skills/prod-deploy/deploy-plan.mjs [--base <ref>] [--head <ref>] [--no-fetch]
 *
 * Defaults to origin/main...origin/dev. Reads every file out of the git refs
 * rather than the working tree, so it stays correct while you are sitting on a
 * feature branch with uncommitted work.
 */

import { execFileSync } from 'node:child_process'

const PROD_REF = 'vvoceaaelejovohhqjsu'
const STAGING_REF = 'ngbwyarbxnyfmdeyvlsd'

const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const noFetch = argv.includes('--no-fetch')

function git(args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  } catch (err) {
    if (allowFail) return ''
    throw err
  }
}
const gitOk = (args) => {
  try {
    execFileSync('git', args, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const out = []
const say = (s = '') => out.push(s)

// ---------------------------------------------------------------- refs

if (!noFetch) git(['fetch', 'origin', '--quiet'], { allowFail: true })

const resolve = (preferred, fallback) =>
  gitOk(['rev-parse', '--verify', '--quiet', preferred]) ? preferred : fallback

const BASE = arg('--base', resolve('origin/main', 'main'))
const HEAD = arg('--head', resolve('origin/dev', 'dev'))

for (const ref of [BASE, HEAD]) {
  if (!gitOk(['rev-parse', '--verify', '--quiet', ref])) {
    console.error(`deploy-plan: cannot resolve ref "${ref}"`)
    process.exit(1)
  }
}

const sha = (r) => git(['rev-parse', '--short', r]).trim()
const ahead = git(['rev-list', '--count', BASE + '..' + HEAD]).trim()
const behind = git(['rev-list', '--count', HEAD + '..' + BASE]).trim()
const dirty = git(['status', '--porcelain'], { allowFail: true }).trim()
const currentBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()

say('=== PILATES PHYSICS PROD DEPLOY PLAN ===')
say(`base (prod)  ${BASE} @ ${sha(BASE)}`)
say(`head (dev)   ${HEAD} @ ${sha(HEAD)}`)
say(
  `commits to ship: ${ahead}` +
    (behind !== '0'
      ? `   !! base has ${behind} commit(s) head does not — NOT a fast-forward`
      : '   (fast-forward)')
)
say(
  `on branch: ${currentBranch}` +
    (dirty ? `   !! working tree dirty (${dirty.split('\n').length} file(s))` : '')
)

if (ahead === '0') {
  say('')
  say('Nothing to ship. main and dev are level.')
  console.log(out.join('\n'))
  process.exit(0)
}

// ---------------------------------------------------------------- diff

const changes = git(['diff', '--name-status', '-M', BASE + '...' + HEAD])
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const parts = line.split('\t')
    return { status: parts[0][0], path: parts[parts.length - 1] }
  })

const touched = (re) => changes.filter((c) => re.test(c.path))
const show = (ref, path) => git(['show', ref + ':' + path], { allowFail: true })

function grepAt(ref, pattern, paths) {
  const raw = git(['grep', '-I', '-n', '-E', pattern, ref, '--', ...paths], { allowFail: true })
  const rows = []
  for (const line of raw.split('\n')) {
    if (!line) continue
    const m = line.match(/^[^:]+:([^:]+):\d+:(.*)$/)
    if (m) rows.push({ file: m[1], text: m[2] })
  }
  return rows
}

say('')
say(`--- COMMITS (${ahead}) ---`)
const log = git(['log', '--oneline', '--no-merges', BASE + '..' + HEAD])
  .split('\n')
  .filter(Boolean)
for (const line of log.slice(0, 40)) say('  ' + line)
if (log.length > 40) say(`  ... and ${log.length - 40} more`)

// ---------------------------------------------------------------- migrations

const MIG = /^supabase\/migrations\//
const strip = (p) => p.replace('supabase/migrations/', '')
const migAdded = touched(MIG)
  .filter((c) => c.status === 'A')
  .map((c) => c.path)
  .sort()
const migChanged = touched(MIG)
  .filter((c) => c.status === 'M' || c.status === 'R')
  .map((c) => c.path)
const migDeleted = touched(MIG)
  .filter((c) => c.status === 'D')
  .map((c) => c.path)

say('')
say('--- MIGRATIONS ---')
if (!migAdded.length && !migChanged.length && !migDeleted.length) {
  say('none changed in this diff')
} else {
  if (migAdded.length) {
    say(`new in this diff (${migAdded.length}):`)
    for (const p of migAdded) say('  ' + strip(p))
  }
  if (migChanged.length) {
    say('!! MODIFIED after the fact — if that version already applied on prod, db push SKIPS it.')
    say('   Read the change and decide whether it needs a fresh migration instead:')
    for (const p of migChanged) say('  ' + strip(p))
  }
  if (migDeleted.length) {
    say('!! DELETED from the repo — an already-applied version stays applied on prod:')
    for (const p of migDeleted) say('  ' + strip(p))
  }
}
say('')
say('!! `supabase db push` applies EVERY local migration the linked project lacks,')
say('   not just the ones in this diff. prod and staging drift: a migration pushed')
say('   to staging from a feature branch is not on prod, and a branch can carry a')
say('   migration file purely to satisfy staging history. After linking prod, run')
say('   `supabase migration list` and read the real delta before pushing. Anything')
say('   local-only that you did not mean to ship has to be sorted out first.')

const cronJobs = new Set()
const extensions = new Set()
const seedTables = new Set()

for (const path of migAdded) {
  const body = show(HEAD, path)
  if (!body) continue
  for (const m of body.matchAll(/cron\.(?:schedule|unschedule)\(\s*'([^']+)'/gi)) cronJobs.add(m[1])
  for (const m of body.matchAll(/create\s+extension\s+(?:if\s+not\s+exists\s+)?"?([a-z_0-9]+)"?/gi)) {
    extensions.add(m[1])
  }
  for (const m of body.matchAll(/insert\s+into\s+(?:public\.)?([a-z_0-9]+)/gi)) seedTables.add(m[1])
}

if (cronJobs.size || extensions.size || seedTables.size) {
  say('')
  say('flags in the new migrations:')
  if (extensions.size) say('  extensions: ' + [...extensions].join(', '))
  if (cronJobs.size) say('  pg_cron jobs: ' + [...cronJobs].join(', '))
  if (seedTables.size) {
    say('  seeds data into: ' + [...seedTables].join(', '))
    say('    -> seed migrations carry content, not just schema. Re-read them: a row')
    say('       referencing a Stripe price id, a Kit tag, or a storage path is')
    say('       environment-specific, and the staging value is wrong on prod.')
  }
}

// ---------------------------------------------------------------- api routes

const isRoute = (p) => /^api\//.test(p) && p.endsWith('.js') && !p.startsWith('api/_lib/')
const routeChanges = changes.filter((c) => isRoute(c.path))
const newRoutes = routeChanges
  .filter((c) => c.status === 'A')
  .map((c) => c.path)
  .sort()
const modRoutes = routeChanges
  .filter((c) => c.status === 'M' || c.status === 'R')
  .map((c) => c.path)
  .sort()
const delRoutes = routeChanges
  .filter((c) => c.status === 'D')
  .map((c) => c.path)
  .sort()

const libChanged = touched(/^api\/_lib\//)
  .filter((c) => c.status !== 'D')
  .map((c) => c.path.replace('api/_lib/', ''))

// Import graph at HEAD so a _lib edit pulls in every dependent route.
const routeDeps = new Map()
const libDeps = new Map()
for (const row of grepAt(HEAD, '_lib/', ['api'])) {
  const hits = [...row.text.matchAll(/['"][./]*_lib\/([\w.-]+\.js)['"]/g)].map((m) => m[1])
  if (!hits.length) continue
  if (row.file.startsWith('api/_lib/')) {
    const self = row.file.replace('api/_lib/', '')
    if (!libDeps.has(self)) libDeps.set(self, new Set())
    for (const h of hits) libDeps.get(self).add(h)
  } else {
    if (!routeDeps.has(row.file)) routeDeps.set(row.file, new Set())
    for (const h of hits) routeDeps.get(row.file).add(h)
  }
}
// _lib modules import each other with a bare './name.js'
for (const row of grepAt(HEAD, "from ['\"]\\./", ['api/_lib'])) {
  const self = row.file.replace('api/_lib/', '')
  for (const m of row.text.matchAll(/['"]\.\/([\w.-]+\.js)['"]/g)) {
    if (!libDeps.has(self)) libDeps.set(self, new Set())
    libDeps.get(self).add(m[1])
  }
}
function closure(files) {
  const seen = new Set()
  const stack = [...files]
  while (stack.length) {
    const f = stack.pop()
    if (seen.has(f)) continue
    seen.add(f)
    for (const d of libDeps.get(f) || []) stack.push(d)
  }
  return seen
}
const libDependents = []
for (const [file, direct] of routeDeps) {
  const hits = libChanged.filter((s) => closure(direct).has(s))
  if (hits.length) libDependents.push({ file, via: hits })
}

say('')
say('--- API ROUTES ---')
say('Vercel rebuilds and redeploys every function from the git push, so there is no')
say('per-function deploy step. This list is what to watch and smoke-test.')
if (newRoutes.length) say('new: ' + newRoutes.join(', '))
if (modRoutes.length) say('modified: ' + modRoutes.join(', '))
if (delRoutes.length) say('removed: ' + delRoutes.join(', '))
if (!routeChanges.length) say('no route files changed directly')
if (libChanged.length) {
  say('')
  say('_lib changed: ' + libChanged.join(', '))
  const indirect = libDependents
    .filter((d) => !routeChanges.some((c) => c.path === d.file))
    .map((d) => `${d.file} (via ${d.via.join(', ')})`)
    .sort()
  say(`  -> ${libDependents.length} route(s) change behaviour as a result.`)
  if (indirect.length) {
    say('     These have no diff of their own, so they are the ones easy to forget:')
    for (const line of indirect) say('       ' + line)
  } else {
    say('     All of them already appear above, so there is nothing extra to watch.')
  }
}

// ---------------------------------------------------------------- env

const VITE = /import\.meta\.env\.([A-Z][A-Z_0-9]*)/g
const PROCESS_ENV = /process\.env\.([A-Z][A-Z_0-9]*)/g
const VITE_PATHS = ['src', 'index.html', 'vite.config.js']

function envNamesAt(ref, paths, pattern, extract) {
  const s = new Set()
  for (const row of grepAt(ref, pattern, paths)) {
    for (const m of row.text.matchAll(extract)) s.add(m[1])
  }
  return s
}
const viteHead = envNamesAt(HEAD, VITE_PATHS, 'import\\.meta\\.env\\.', VITE)
const viteBase = envNamesAt(BASE, VITE_PATHS, 'import\\.meta\\.env\\.', VITE)
const apiHead = envNamesAt(HEAD, ['api'], 'process\\.env\\.', PROCESS_ENV)
const apiBase = envNamesAt(BASE, ['api'], 'process\\.env\\.', PROCESS_ENV)

const newVite = [...viteHead].filter((v) => !viteBase.has(v)).sort()
const newApi = [...apiHead].filter((v) => !apiBase.has(v)).sort()

say('')
say('--- VERCEL ENV (Production scope) ---')
if (newVite.length) {
  say('NEW build-time (VITE_*): ' + newVite.join(', '))
  say('  <- must exist in Vercel Production BEFORE main is pushed. These are')
  say('     inlined into the bundle at build time; adding one afterwards needs a rebuild.')
}
if (newApi.length) say('NEW runtime (api/*): ' + newApi.join(', '))
if (!newVite.length && !newApi.length) say('no new variable referenced — nothing to add')
say('')
say('all referenced at head:')
say('  build-time: ' + [...viteHead].sort().join(', '))
say('  runtime:    ' + [...apiHead].sort().join(', '))
say('')
say('These hold DIFFERENT values on prod. Never copy staging across:')
say('  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (different project),')
say('  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (live keys, and the prod endpoint signing secret),')
say('  SITE_BASE_URL.')

// ---------------------------------------------------------------- vercel.json

say('')
say('--- VERCEL.JSON ---')
const parse = (ref) => {
  try {
    return JSON.parse(show(ref, 'vercel.json') || '{}')
  } catch {
    return {}
  }
}
const headCfg = parse(HEAD)
if (!changes.some((c) => c.path === 'vercel.json')) {
  say('unchanged')
} else {
  const baseCfg = parse(BASE)
  const cronPaths = (c) => new Set((c.crons || []).map((x) => x.path))
  const headCrons = cronPaths(headCfg)
  const baseCrons = cronPaths(baseCfg)
  const addedCrons = [...headCrons].filter((p) => !baseCrons.has(p))
  const removedCrons = [...baseCrons].filter((p) => !headCrons.has(p))
  if (addedCrons.length) {
    say('new crons: ' + addedCrons.join(', '))
    say('  -> Vercel registers these from the deployed config, nothing to click.')
    say('     They authenticate with CRON_SECRET; unset, the handler runs unauthenticated.')
  }
  if (removedCrons.length) say('removed crons: ' + removedCrons.join(', '))
  const addedFns = Object.keys(headCfg.functions || {}).filter(
    (f) => !Object.keys(baseCfg.functions || {}).includes(f)
  )
  if (addedFns.length) say('new function config (includeFiles): ' + addedFns.join(', '))
  if (JSON.stringify(headCfg.rewrites) !== JSON.stringify(baseCfg.rewrites)) {
    say('!! rewrites changed — re-read them, this is what routes the SPA vs /api')
  }
}

// A route that reads from disk needs an includeFiles entry or it fails at runtime.
const configured = new Set(Object.keys(headCfg.functions || {}))
const diskReaders = new Set()
for (const row of grepAt(HEAD, 'readFileSync|process\\.cwd\\(\\)', ['api'])) {
  if (isRoute(row.file)) diskReaders.add(row.file)
}
const missingInclude = [...diskReaders].filter((f) => !configured.has(f)).sort()
if (missingInclude.length) {
  say('')
  say('!! reads files from disk but has no vercel.json functions entry:')
  for (const f of missingInclude) say('   ' + f)
  say('   Without includeFiles the file is not bundled, and the read fails only at runtime.')
}

// ---------------------------------------------------------------- other

say('')
say('--- OTHER ---')
const notes = []
const count = (re) => touched(re).length
if (count(/^supabase\/email-templates\//)) {
  notes.push(
    'email templates changed — the files ship with the build (vercel.json includeFiles), but the ' +
      'Supabase Auth dashboard templates are per-project and set by hand. Check whether prod needs updating too.'
  )
}
if (count(/^animations\//)) notes.push('animations/ changed — bundled via includeFiles, no manual step')
if (changes.some((c) => /^package(-lock)?\.json$/.test(c.path))) {
  notes.push('dependencies changed — Vercel reinstalls on build; watch the build log')
}
if (count(/^public\//)) notes.push('public/ assets changed — shipped with the build')
if (count(/^scripts\//)) notes.push('scripts/ changed — these run from your machine, nothing to deploy')
if (count(/^docs\//)) notes.push('docs/ changed — repo only, not deployed')
if (changes.some((c) => /^api\/(checkout|stripe)\//.test(c.path))) {
  notes.push(
    'checkout or the Stripe webhook changed — prod uses live keys and its own webhook endpoint. ' +
      'Confirm the prod endpoint is registered in the Stripe dashboard and that STRIPE_WEBHOOK_SECRET ' +
      'in Vercel Production matches THAT endpoint, not staging.'
  )
}
if (changes.some((c) => c.path === 'api/_lib/kit.js')) {
  notes.push('Kit integration changed — tag names live on webinars rows as data; check prod values')
}
say(notes.length ? notes.map((n) => '- ' + n).join('\n') : 'nothing else')

// ---------------------------------------------------------------- commands

say('')
say('--- COMMANDS ---')
say('[preflight] there is no CI in this repo, so these are the gate')
say('npm run lint')
say('npm run build')
say('')
say('[1 migrations] link prod first — every supabase command targets whatever is linked')
say(`supabase link --project-ref ${PROD_REF}`)
say('supabase migration list')
say('supabase db push --dry-run')
say('supabase db push')
say('')
say('[2 merge + deploy] the push IS the deploy; Vercel builds Production from main')
say('git checkout main')
say('git pull --ff-only')
say(
  behind === '0'
    ? 'git merge --ff-only dev'
    : 'git merge dev   # NOT a fast-forward — main has commits dev lacks'
)
say('git push origin main')
say('')
say('[last] relink staging — every later supabase command reads the link')
say(`supabase link --project-ref ${STAGING_REF}`)

// ---------------------------------------------------------------- verification

say('')
say('--- VERIFICATION SQL (prod SQL editor) ---')
if (migAdded.length) {
  const versions = migAdded.map((p) => strip(p).split('_')[0])
  say('-- migrations landed')
  say(
    `select version from supabase_migrations.schema_migrations where version in (${versions
      .map((v) => `'${v}'`)
      .join(', ')}) order by version;`
  )
  say(`-- expect ${versions.length} row(s)`)
}
if (cronJobs.size) {
  say('')
  say('-- pg_cron jobs registered and active')
  say(
    `select jobname, schedule, active from cron.job where jobname in (${[...cronJobs]
      .map((v) => `'${v}'`)
      .join(', ')}) order by jobname;`
  )
}
if (!migAdded.length && !cronJobs.size) say('nothing to verify in SQL')

console.log(out.join('\n'))
