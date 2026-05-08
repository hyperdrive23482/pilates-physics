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

// Create a broadcast in Kit. If `sendAt` is provided, the broadcast is scheduled
// for that time; otherwise it is created as a draft (no automatic send).
// Returns the broadcast object so the caller can persist its id.
export async function createBroadcast({ subject, contentHtml, contentText, sendAt }) {
  if (!subject) throw new Error('createBroadcast: subject is required')
  if (!contentHtml && !contentText) {
    throw new Error('createBroadcast: contentHtml or contentText is required')
  }
  const body = {
    subject,
    content: contentHtml ?? contentText,
    public: false,
    description: 'Pilates Physics — Content Management',
  }
  if (contentText) body.email_template_id = undefined
  if (sendAt) body.send_at = new Date(sendAt).toISOString()

  const res = await fetch(`${KIT_BASE}/broadcasts`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kit createBroadcast ${res.status}: ${text}`)
  }
  const data = await res.json()
  return data.broadcast ?? data
}
