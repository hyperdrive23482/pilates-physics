const KIT_BASE = 'https://api.kit.com/v4'

const tagCache = new Map()
let tagCacheFetchedAt = 0
const TAG_CACHE_TTL_MS = 5 * 60 * 1000

const templateCache = new Map()
let templateCacheFetchedAt = 0
const TEMPLATE_CACHE_TTL_MS = 5 * 60 * 1000

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

async function loadTemplatesIntoCache() {
  const res = await fetch(`${KIT_BASE}/email_templates`, { headers: headers() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit GET /email_templates ${res.status}: ${body}`)
  }
  const data = await res.json()
  templateCache.clear()
  for (const t of data.email_templates ?? []) {
    templateCache.set(t.name, t.id)
  }
  templateCacheFetchedAt = Date.now()
}

async function resolveTemplateId(templateName) {
  if (!templateName) return null
  const stale = Date.now() - templateCacheFetchedAt > TEMPLATE_CACHE_TTL_MS
  if (stale || !templateCache.has(templateName)) {
    await loadTemplatesIntoCache()
  }
  const id = templateCache.get(templateName)
  if (!id) {
    const available = Array.from(templateCache.keys()).join(', ')
    throw new Error(
      `Kit email template not found: "${templateName}". Available: ${available || '(none)'}`,
    )
  }
  return id
}

async function resolveTemplateForBroadcast(templateName) {
  const resolvedName = templateName ?? process.env.KIT_BROADCAST_TEMPLATE ?? 'Newsletter Template'
  try {
    return await resolveTemplateId(resolvedName)
  } catch (err) {
    // If the named template doesn't exist, fall through to Kit's default
    // rather than failing the whole publish flow.
    console.warn(`Kit template resolution failed: ${err.message}`)
    return null
  }
}

// Create a broadcast in Kit. If `sendAt` is provided, the broadcast is scheduled
// for that time; otherwise it is created as a draft (no automatic send).
//
// Template resolution order:
//   1. explicit `templateName` arg
//   2. KIT_BROADCAST_TEMPLATE env var
//   3. "Newsletter Template" fallback
//   4. if none of those resolve, send without a template_id (Kit uses its default)
//
// Returns the broadcast object so the caller can persist its id.
export async function createBroadcast({ subject, previewText, contentHtml, contentText, sendAt, templateName }) {
  if (!subject) throw new Error('createBroadcast: subject is required')
  if (!contentHtml && !contentText) {
    throw new Error('createBroadcast: contentHtml or contentText is required')
  }

  const templateId = await resolveTemplateForBroadcast(templateName)

  const body = {
    subject,
    content: contentHtml ?? contentText,
    public: false,
    description: 'Pilates Physics — Content Management',
  }
  if (previewText) body.preview_text = previewText
  if (templateId) body.email_template_id = templateId
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

// Update an existing broadcast in Kit by id. Pass only the fields you want
// changed. To clear scheduling and revert to draft, pass `sendAt: null`.
export async function updateBroadcast(id, { subject, previewText, contentHtml, contentText, sendAt, templateName } = {}) {
  if (!id) throw new Error('updateBroadcast: id is required')

  const body = {}
  if (subject !== undefined) body.subject = subject
  if (previewText !== undefined) body.preview_text = previewText ?? null
  if (contentHtml !== undefined || contentText !== undefined) {
    body.content = contentHtml ?? contentText
  }
  if (templateName !== undefined) {
    const tid = await resolveTemplateForBroadcast(templateName)
    if (tid) body.email_template_id = tid
  }
  if (sendAt !== undefined) {
    body.send_at = sendAt === null ? null : new Date(sendAt).toISOString()
  }

  const res = await fetch(`${KIT_BASE}/broadcasts/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kit updateBroadcast ${res.status}: ${text}`)
  }
  const data = await res.json()
  return data.broadcast ?? data
}
