const KIT_BASE = 'https://api.kit.com/v4'

const tagCache = new Map()
let tagCacheFetchedAt = 0
const TAG_CACHE_TTL_MS = 5 * 60 * 1000

function headers() {
  return {
    'X-Kit-Api-Key': process.env.KIT_API_KEY,
    'Content-Type': 'application/json',
  }
}

async function upsertSubscriber(email, firstName, lastName) {
  const res = await fetch(`${KIT_BASE}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email_address: email,
      first_name: firstName || undefined,
      state: 'active',
      fields: lastName ? { last_name: lastName } : undefined,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit upsertSubscriber ${res.status}: ${body}`)
  }
  return res.json()
}

async function loadTagsIntoCache() {
  const res = await fetch(`${KIT_BASE}/tags`, { headers: headers() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit GET /tags ${res.status}: ${body}`)
  }
  const data = await res.json()
  tagCache.clear()
  for (const tag of data.tags || []) {
    tagCache.set(tag.name, tag.id)
  }
  tagCacheFetchedAt = Date.now()
}

async function resolveTagId(tagName) {
  const stale = Date.now() - tagCacheFetchedAt > TAG_CACHE_TTL_MS
  if (stale || !tagCache.has(tagName)) {
    await loadTagsIntoCache()
  }
  const id = tagCache.get(tagName)
  if (!id) throw new Error(`Kit tag not found: "${tagName}". Create it in the Kit dashboard first.`)
  return id
}

async function applyTag(tagId, email) {
  const res = await fetch(`${KIT_BASE}/tags/${tagId}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit applyTag ${res.status}: ${body}`)
  }
  return res.json()
}

export async function tagSubscriber(email, firstName, lastName, tagName) {
  await upsertSubscriber(email, firstName, lastName)
  const tagId = await resolveTagId(tagName)
  await applyTag(tagId, email)
}
