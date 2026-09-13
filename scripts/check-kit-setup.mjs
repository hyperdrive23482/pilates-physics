// Does Kit have the exact tags and custom-field keys the offer machinery writes?
//
// Worth running before the first cron run, because the two failure modes here
// are quiet ones. A tag named slightly differently throws at resolve time and
// nobody is minted; a custom field whose KEY is not exactly what the cron
// writes is worse, because Kit accepts the write, ignores the key, and only
// mentions it in a `warnings` array.
//
// Run:  node scripts/check-kit-setup.mjs YOUR_KIT_API_KEY
//
// The key can also come from a KIT_API_KEY environment variable, but passing it
// as an argument avoids PowerShell's lack of an inline env-var prefix and its
// missing && operator, which is where this otherwise goes wrong.

const KEY = process.argv[2] || process.env.KIT_API_KEY
if (!KEY) {
  console.error('Usage: node scripts/check-kit-setup.mjs YOUR_KIT_API_KEY')
  console.error('Find the key in Kit: Settings -> Advanced -> API, or copy KIT_API_KEY from Vercel.')
  process.exit(2)
}

const BASE = 'https://api.kit.com/v4'
const headers = { 'X-Kit-Api-Key': KEY, 'Content-Type': 'application/json' }

// Exactly what the CODE reads and writes: api/cron/mint-offers.js for the tags,
// and webinars.kit_tag (migration 045) for HARW-purchased. A miss here stops the
// offer working. If you change one there, change it here.
const NEEDED_TAGS = ['in-HARW-sequence', 'HARW-purchased', 'HARW-backfill']
const NEEDED_FIELD_KEYS = ['offer_token', 'offer_deadline']

// Referenced only by the Kit automations, never by code, so a miss is worth
// knowing about rather than fatal. Checked because the tag family has already
// produced one transposition (in-HAWR-sequence, 2026-09-13) and this is the
// cheapest place to catch the next one.
const AUTOMATION_TAGS = ['HARW-didnotbuy']

async function getAll(path, collection) {
  const items = []
  let after = null
  for (let i = 0; i < 20; i += 1) {
    const url = new URL(`${BASE}${path}`)
    url.searchParams.set('per_page', '500')
    if (after) url.searchParams.set('after', after)
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`GET ${path} ${res.status}: ${await res.text()}`)
    const data = await res.json()
    items.push(...(data[collection] ?? []))
    if (!data.pagination?.has_next_page) break
    after = data.pagination.end_cursor
  }
  return items
}

let bad = 0
const ok = (cond, msg) => {
  if (!cond) bad += 1
  console.log(`${cond ? 'OK  ' : 'MISS'}  ${msg}`)
}

const tags = await getAll('/tags', 'tags')
const tagNames = new Set(tags.map((t) => t.name))

console.log('-- tags --')
const missingTags = []
for (const name of NEEDED_TAGS) {
  const hit = tagNames.has(name)
  ok(hit, name)
  if (!hit) missingTags.push(name)
}

// A missing tag is almost always a rename rather than an absence -- the MOR to
// HARW rename on 2026-09-08 is the obvious candidate. Print the account's real
// tags so the actual name is visible instead of guessed at.
if (missingTags.length) {
  console.log('')
  console.log(`-- every tag in the account (${tags.length}) --`)
  for (const t of [...tagNames].sort((a, b) => a.localeCompare(b))) {
    console.log(`      ${t}`)
  }
  console.log('')
  console.log('      Either rename the tag in Kit to the name above, or tell me the')
  console.log('      real name and I will change it in api/cron/mint-offers.js.')
  console.log('      The name must match EXACTLY, including case.')
}

console.log('')
console.log('-- tags used by the Kit automations (not by code) --')
for (const name of AUTOMATION_TAGS) {
  const hit = tagNames.has(name)
  console.log(`${hit ? 'OK  ' : 'note'}  ${name}${hit ? '' : '  (not created yet -- fine if that automation step is not built)'}`)
}

// ---- The two cohorts during the go-live transition ---------------------
//
// in-HARW-sequence is what the cron mints against. HARW-requeue is the holding
// tag that survives the gap between removing the offer tag and re-applying it:
// removing it is what makes Kit re-fire the sequence automation for people whose
// trigger already fired while it was switched off, and without a holding tag
// that list is simply gone.
async function countTagged(name) {
  const tag = tags.find((t) => t.name === name)
  if (!tag) return null
  const res = await fetch(
    `${BASE}/tags/${tag.id}/subscribers?per_page=1&include_total_count=true`,
    { headers },
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.pagination?.total_count ?? data.total_count ?? 0
}

const waiting = await countTagged('in-HARW-sequence')
const parked = await countTagged('HARW-requeue')

console.log('')
console.log('-- cohorts --')
console.log(`      in-HARW-sequence  ${waiting ?? '(tag missing)'}`)
console.log(`      HARW-requeue      ${parked === null ? '(not created yet)' : parked}`)

console.log('')
if (waiting) {
  console.log(`      ${waiting} subscriber(s) are in the cart sequence tag.`)
  console.log('      While MINT_OFFERS_ENABLED is unset the cron is a dry run and')
  console.log('      nothing happens to them. The moment it is set to "true", each of')
  console.log('      these starts a four-day clock -- so park them under HARW-requeue')
  console.log('      and remove in-HARW-sequence BEFORE enabling, then re-apply in')
  console.log('      waves afterwards. A window that expires before the emails send')
  console.log('      cannot be reissued: the unique index refuses a second one.')
} else if (parked) {
  console.log(`      Nobody is waiting and ${parked} are parked. This is the state to be in`)
  console.log('      when you set MINT_OFFERS_ENABLED=true. Re-apply in-HARW-sequence in')
  console.log('      waves after that, and clear HARW-requeue as each wave goes through.')
} else {
  console.log('      Nobody waiting, nobody parked. A cron run will mint nothing.')
}

const fields = await getAll('/custom_fields', 'custom_fields')
const byKey = new Map(fields.map((f) => [f.key, f]))

console.log('')
console.log('-- custom field keys --')
for (const key of NEEDED_FIELD_KEYS) {
  const hit = byKey.get(key)
  ok(Boolean(hit), hit ? `${key}  (label: "${hit.label}")` : `${key}`)
}

// The most likely mistake is a field created as "Offer Token", which may not
// produce the key the cron writes. Surface anything close so the fix is obvious
// rather than a hunt.
const nearMisses = fields.filter(
  (f) => !NEEDED_FIELD_KEYS.includes(f.key) && /offer/i.test(`${f.key} ${f.label}`),
)
if (nearMisses.length) {
  console.log('')
  console.log('-- close, but not what the code writes --')
  for (const f of nearMisses) {
    console.log(`      key "${f.key}"  (label: "${f.label}")`)
  }
  console.log('      Rename the LABEL so the key comes out exactly as needed, or')
  console.log('      delete and recreate it named exactly offer_token / offer_deadline.')
}

console.log('')
if (bad === 0) {
  console.log('All set. Merge tags for the emails:')
  console.log('  {{ subscriber.offer_token }}')
  console.log('  {{ subscriber.offer_deadline }}')
} else {
  console.log(`${bad} thing(s) missing. The cron will not mint until they exist.`)
}
process.exit(bad === 0 ? 0 : 1)
