import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

const STORAGE_BUCKET = 'webinar-content'

// Fields inherited from the source workshop unless the caller overrides them.
const COPY_FIELDS = [
  'title',
  'subtitle',
  'description',
  'price_cents',
  'kind',
  'duration_min',
  'hero_image_url',
  'kit_tag',
  'stripe_price_id',
  'npcp_cecs',
  'npcp_course_id',
  'npcp_approval_date',
]

// Session-specific fields. Reset by default so a clone can never inherit the
// previous session's Zoom room, recording, or bonus window; an explicit
// override still wins (the create form sends whatever the admin typed).
const RESET_DEFAULTS = {
  status: 'draft',
  scheduled_at: null,
  zoom_link: null,
  zoom_passcode: null,
  recording_url: null,
  bonus_webinar_id: null,
  bonus_starts_at: null,
  bonus_ends_at: null,
}

// Everything the admin create form is allowed to set on the new row.
const OVERRIDE_FIELDS = [
  ...COPY_FIELDS,
  'slug',
  'status',
  'scheduled_at',
  'zoom_link',
  'zoom_passcode',
  'recording_url',
  'bonus_webinar_id',
  'bonus_starts_at',
  'bonus_ends_at',
]

const CONTENT_FIELDS = ['type', 'title', 'description', 'available_after', 'sort_order']

function isStoragePath(url) {
  return !!url && !/^https?:\/\//i.test(url)
}

function basename(path) {
  const parts = String(path).split('/')
  return parts[parts.length - 1] || ''
}

// The survey's open/close window belongs to the session that was cloned, so
// the questions carry over but the dates don't.
function stripSurveyDates(config) {
  if (!config || typeof config !== 'object') return null
  return { ...config, opens_at: null, closes_at: null }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const { source_id, overrides = {}, options = {} } = req.body ?? {}
    if (!source_id) return res.status(400).json({ error: 'source_id is required' })

    const copyContent = options.copy_content !== false
    const includeRecordings = options.include_recordings === true
    const copySurvey = options.copy_survey !== false

    const { data: source, error: srcErr } = await supabaseAdmin
      .from('webinars')
      .select('*')
      .eq('id', source_id)
      .maybeSingle()
    if (srcErr) throw srcErr
    if (!source) return res.status(404).json({ error: 'Source workshop not found' })

    // ---- Build the new workshop row -------------------------------------
    const row = {}
    for (const f of COPY_FIELDS) row[f] = source[f] ?? null
    Object.assign(row, RESET_DEFAULTS)
    for (const f of OVERRIDE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(overrides, f)) row[f] = overrides[f]
    }
    row.survey_config = copySurvey ? stripSurveyDates(source.survey_config) : null

    if (!row.title?.trim()) return res.status(400).json({ error: 'Title is required' })
    if (!row.slug?.trim()) return res.status(400).json({ error: 'Slug is required' })
    row.title = row.title.trim()
    row.slug = row.slug.trim()

    const { data: created, error: insErr } = await supabaseAdmin
      .from('webinars')
      .insert(row)
      .select()
      .single()
    if (insErr) {
      if (insErr.code === '23505') {
        return res.status(409).json({ error: `The slug "${row.slug}" is already taken.` })
      }
      throw insErr
    }

    const warnings = []

    if (!copyContent) {
      return res.status(200).json({
        id: created.id,
        slug: created.slug,
        content_copied: 0,
        files_copied: 0,
        warnings,
      })
    }

    // ---- Copy content items ---------------------------------------------
    const { data: sourceItems, error: itemsErr } = await supabaseAdmin
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', source.id)
      .order('sort_order', { ascending: true })
    if (itemsErr) throw itemsErr

    if (!sourceItems?.length) {
      return res.status(200).json({
        id: created.id,
        slug: created.slug,
        content_copied: 0,
        files_copied: 0,
        warnings,
      })
    }

    // Storage RLS grants entitled users read access only when the object's
    // first path segment is a webinar they own (005_admin_storage.sql), so
    // every uploaded file has to be physically copied into the new folder.
    // A path referenced by two items is copied once.
    const copiedPaths = new Map() // oldPath -> newPath | null
    let filesCopied = 0

    async function resolveFileUrl(item) {
      const url = item.file_url
      if (!url) return null
      if (!isStoragePath(url)) return url
      if (copiedPaths.has(url)) return copiedPaths.get(url)

      const newPath = `${created.id}/${basename(url)}`
      const { error: copyErr } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .copy(url, newPath)
      if (copyErr) {
        // Leaving the source path in place would sign fine for an admin and
        // 403 for every buyer, so drop the file and say so instead.
        copiedPaths.set(url, null)
        warnings.push(`Could not copy the file for "${item.title}" (${url}): ${copyErr.message}`)
        return null
      }
      copiedPaths.set(url, newPath)
      filesCopied += 1
      return newPath
    }

    const rows = []
    for (const item of sourceItems) {
      const next = { webinar_id: created.id }
      for (const f of CONTENT_FIELDS) next[f] = item[f]
      // Recordings belong to the session that was cloned. Keep the row so the
      // structure survives, but leave the file for the admin to attach.
      next.file_url =
        !includeRecordings && item.type === 'recording' ? null : await resolveFileUrl(item)
      rows.push(next)
    }

    const { error: contentErr } = await supabaseAdmin.from('webinar_content').insert(rows)
    if (contentErr) {
      warnings.push(`The workshop was created but its content could not be copied: ${contentErr.message}`)
      return res.status(200).json({
        id: created.id,
        slug: created.slug,
        content_copied: 0,
        files_copied: filesCopied,
        warnings,
      })
    }

    return res.status(200).json({
      id: created.id,
      slug: created.slug,
      content_copied: rows.length,
      files_copied: filesCopied,
      warnings,
    })
  } catch (err) {
    console.error('clone-workshop error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
