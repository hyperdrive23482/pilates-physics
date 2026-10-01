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

async function upsertSubscriber(email, firstName) {
  const res = await fetch(`${KIT_BASE}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      email_address: email,
      first_name: firstName || undefined,
      state: 'active',
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit upsertSubscriber ${res.status}: ${body}`)
  }
  return res.json()
}

let allTagsCache = []

// Kit caps /tags at 500 per page and paginates by cursor, so this has to loop.
// Unpaginated, a newly created tag past the first page is simply invisible:
// resolveTagId throws "tag not found" for it while every older tag keeps
// resolving, which reads like a typo in the tag name rather than a paging bug.
async function loadTagsIntoCache() {
  tagCache.clear()
  allTagsCache = []
  let after = null
  do {
    const params = new URLSearchParams({ per_page: '500' })
    if (after) params.set('after', after)
    const res = await fetch(`${KIT_BASE}/tags?${params}`, { headers: headers() })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Kit GET /tags ${res.status}: ${body}`)
    }
    const data = await res.json()
    for (const tag of data.tags || []) {
      tagCache.set(tag.name, tag.id)
      allTagsCache.push({ id: tag.id, name: tag.name })
    }
    const page = data.pagination ?? {}
    after = page.has_next_page ? page.end_cursor : null
  } while (after)
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

// Returns [{ id, name }] for every tag in the Kit account, sorted by name.
// Used by the admin UI to populate the audience selector.
export async function listTags() {
  const stale = Date.now() - tagCacheFetchedAt > TAG_CACHE_TTL_MS
  if (stale || allTagsCache.length === 0) {
    await loadTagsIntoCache()
  }
  return [...allTagsCache].sort((a, b) => a.name.localeCompare(b.name))
}

// Build the Kit v4 `subscriber_filter` body shape from a tag-id list + match mode.
// Returns `[]` when no tags (Kit interprets that as "all subscribers"), otherwise
// a single filter group with `any` or `all` populated per the docs.
function buildSubscriberFilter(tagIds, tagMatch) {
  if (!Array.isArray(tagIds) || tagIds.length === 0) return []
  const rule = { type: 'tag', ids: tagIds.map(Number) }
  if (tagMatch === 'all') {
    return [{ all: [rule], any: null, none: null }]
  }
  return [{ all: [], any: [rule], none: null }]
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

// Kit has no endpoint that sets a subscriber's state. POST /v4/subscribers says
// so outright -- "Updating the subscriber state with this endpoint is not
// supported at this time" -- so it honours `state` only when CREATING someone.
// For anyone who already exists it updates the first name, ignores the state
// and returns 200.
//
// That is how a paying customer ends up tagged but invisible. Most buyers first
// arrive as a lead through a double opt-in form, and if they never click the
// confirmation they sit in `inactive` forever. Tagging them still returns 200
// and the tag really is attached -- but Kit's UI, every tag query and every
// broadcast audience default to active-only, so they are silently excluded from
// the emails they just paid for. Nothing throws, so nothing is logged.
//
// Adding them to a SINGLE opt-in form is the only documented way back. The form
// is never embedded anywhere and nobody ever sees it; it exists purely as this
// switch. Kit applies the change asynchronously -- the 201 still reports the old
// state, and it flips a minute or so later -- so there is no point reading the
// state back here to confirm it landed.
async function addSubscriberToForm(formId, email) {
  const res = await fetch(`${KIT_BASE}/forms/${formId}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email_address: email }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit addSubscriberToForm ${res.status}: ${body}`)
  }
  return res.json()
}

export async function tagSubscriber(email, firstName, tagName) {
  const upserted = await upsertSubscriber(email, firstName)

  const tagId = await resolveTagId(tagName)
  await applyTag(tagId, email)

  // Tag first, activate second, deliberately: the tag is the record of what
  // they bought and has to land even if activation fails. The other order would
  // let a form error cost us the tag as well.
  const state = upserted?.subscriber?.state
  if (!state || state === 'active') return

  if (state !== 'inactive') {
    // cancelled / bounced / complained -- they unsubscribed, hard-bounced or
    // reported spam. Re-activating those is not ours to do.
    console.warn(`Kit: ${email} is ${state}, tagged but left as-is`)
    return
  }

  // Thrown, not swallowed, so it reaches stripe_events.error as 'kit_failed'
  // instead of leaving another buyer stranded where nobody would look.
  if (!process.env.KIT_PURCHASE_FORM_ID) {
    throw new Error(
      `Kit subscriber ${email} is inactive and KIT_PURCHASE_FORM_ID is not set, ` +
        `so they were tagged "${tagName}" but remain invisible to every broadcast.`,
    )
  }
  await addSubscriberToForm(process.env.KIT_PURCHASE_FORM_ID, email)
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
// `tagIds` (array of numeric Kit tag IDs) plus `tagMatch` ('any' | 'all')
// produce a Kit v4 subscriber_filter. Empty/omitted tagIds = send to all
// active subscribers.
//
// Returns the broadcast object so the caller can persist its id.
export async function createBroadcast({ subject, previewText, contentHtml, contentText, sendAt, templateName, tagIds, tagMatch }) {
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
  if (tagIds !== undefined) {
    body.subscriber_filter = buildSubscriberFilter(tagIds, tagMatch)
  }

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
// Pass `tagIds: []` to clear an existing audience filter (revert to all subs).
export async function updateBroadcast(id, { subject, previewText, contentHtml, contentText, sendAt, templateName, tagIds, tagMatch } = {}) {
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
  if (tagIds !== undefined) {
    body.subscriber_filter = buildSubscriberFilter(tagIds, tagMatch)
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

// ---------------------------------------------------------------------------
// Offer minting support (api/cron/mint-offers.js)
// ---------------------------------------------------------------------------

// One cursor-page of the subscribers carrying `tagName`.
//
// Kit v4 paginates by cursor, not page number: pass the previous call's
// `nextCursor` back as `after`. `per_page` maxes out at 1000 and defaults to
// 500 server-side.
//
// The response carries each subscriber's `fields` and their `tagged_at`, which
// is why the cron never has to make a second call per person: tagged_at is the
// offer clock's start, and fields shows what Kit already holds.
//
// `status` defaults to 'active' on Kit's side, which is what we want -- there is
// no reason to mint an offer for a bounced or cancelled address.
export async function listSubscribersByTag(tagName, { perPage = 500, after = null } = {}) {
  const tagId = await resolveTagId(tagName)
  const params = new URLSearchParams({ per_page: String(perPage) })
  if (after) params.set('after', after)

  const res = await fetch(`${KIT_BASE}/tags/${tagId}/subscribers?${params}`, {
    headers: headers(),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit listSubscribersByTag ${res.status}: ${body}`)
  }
  const data = await res.json()
  const page = data.pagination ?? {}
  return {
    subscribers: data.subscribers ?? [],
    nextCursor: page.has_next_page ? page.end_cursor : null,
  }
}

// Write custom fields onto one subscriber.
//
// THROWS ON WARNINGS, AND THAT IS THE POINT. Kit does not reject an unknown
// custom-field key: it accepts the request, ignores the key, and mentions it in
// a `warnings` array. If `offer_token` has not been created in the Kit
// dashboard, every write would appear to succeed, the cron would stamp
// kit_synced_at, and the merge field would render blank in the one email that
// carries the link -- silently, for every subscriber, with no way to notice
// after the fact. Treating a warning as a failure means the retry queue holds
// those rows until the field actually exists.
//
// `email_address` is required by the endpoint even when only fields change.
export async function updateSubscriberFields(subscriberId, emailAddress, fields) {
  const res = await fetch(`${KIT_BASE}/subscribers/${subscriberId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ email_address: emailAddress, fields }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit updateSubscriberFields ${res.status}: ${body}`)
  }
  const data = await res.json()
  const warnings = data.warnings ?? []
  if (warnings.length) {
    throw new Error(
      `Kit updateSubscriberFields accepted but ignored fields: ${JSON.stringify(warnings)}. ` +
        `Create the custom fields in the Kit dashboard first.`,
    )
  }
  return data
}

// ---------------------------------------------------------------------------
// Read-only reporting (api/admin/kit/metrics.js)
// ---------------------------------------------------------------------------

async function kitGet(path, params = {}) {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }
  const query = qs.toString()
  const res = await fetch(`${KIT_BASE}${path}${query ? `?${query}` : ''}`, { headers: headers() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Kit GET ${path} ${res.status}: ${body}`)
  }
  return res.json()
}

// Follows Kit's cursor pagination to the end and returns every row under `key`.
// Bounded so a pagination bug cannot spin a request until it times out.
async function kitGetAll(path, key, params = {}) {
  const rows = []
  let after = null
  for (let page = 0; page < 20; page += 1) {
    const data = await kitGet(path, { per_page: 1000, ...params, after })
    rows.push(...(data[key] ?? []))
    const p = data.pagination ?? {}
    if (!p.has_next_page) break
    after = p.end_cursor
  }
  return rows
}

// Sent / opened / clicked totals over Kit's rolling 90 days.
export async function getEmailStats() {
  const data = await kitGet('/account/email_stats')
  return data.stats ?? null
}

// New subscribers, cancellations and the current list size between two dates
// (YYYY-MM-DD). `subscribers` is the list size at `ending`.
export async function getGrowthStats({ starting, ending } = {}) {
  const data = await kitGet('/account/growth_stats', { starting, ending })
  return data.stats ?? null
}

// Newest broadcasts first, with stats inline. One call, and unlike
// GET /broadcasts it does not drag every email body along with it.
export async function listBroadcastStats({ perPage = 50 } = {}) {
  const data = await kitGet('/broadcasts/stats', { per_page: perPage })
  return data.broadcasts ?? []
}

export async function listSequences({ includeStats = true } = {}) {
  return kitGetAll('/sequences', 'sequences', includeStats ? { include: 'stats' } : {})
}

// Each email in order, with recipients / opens / clicks / rates.
export async function listSequenceEmails(sequenceId) {
  const data = await kitGet(`/sequences/${sequenceId}/emails`, { include: 'stats', per_page: 1000 })
  return data.emails ?? data.sequence_emails ?? []
}

// Everyone who has ever entered the sequence, finished or not, with added_at
// and custom fields. Kit does not say where anyone is inside it: the
// sequence's own subscriber_count is the only "still in it" number there is.
export async function listSequenceSubscribers(sequenceId, { status = 'all' } = {}) {
  return kitGetAll(`/sequences/${sequenceId}/subscribers`, 'subscribers', { status })
}

// Every subscriber carrying a tag, across all pages.
export async function listAllSubscribersByTag(tagName, { status = null } = {}) {
  const tagId = await resolveTagId(tagName)
  return kitGetAll(`/tags/${tagId}/subscribers`, 'subscribers', status ? { status } : {})
}

// Active subscribers carrying a tag, counted without paging through them.
export async function countSubscribersByTag(tagName) {
  const tagId = await resolveTagId(tagName)
  const data = await kitGet(`/tags/${tagId}/subscribers`, { per_page: 1, include_total_count: true })
  return data.pagination?.total_count ?? null
}
