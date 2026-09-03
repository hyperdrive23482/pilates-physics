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
  'quiz_pass_pct',
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

// A course carries its curriculum and its assessment, which is the whole
// point of cloning one: the chair edition starts from the reformer's shape
// rather than from an empty list. Videos come along too, since a module with
// no vimeo_url is just a title, and the admin can swap them per module.
const MODULE_FIELDS = ['sort_order', 'title', 'summary', 'vimeo_url', 'duration_min']
const QUIZ_FIELDS = ['sort_order', 'prompt', 'choices', 'correct_index', 'explanation']

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
    let modulesCopied = 0
    let questionsCopied = 0
    // old module id -> new module id, so attachments land under the module
    // they belonged to rather than loose at the course level.
    const moduleIdMap = new Map()

    const done = (extra = {}) =>
      res.status(200).json({
        id: created.id,
        slug: created.slug,
        content_copied: 0,
        files_copied: 0,
        modules_copied: modulesCopied,
        questions_copied: questionsCopied,
        warnings,
        ...extra,
      })

    // ---- Copy the curriculum and quiz (courses only) --------------------
    if (source.kind === 'course') {
      const { data: sourceModules, error: modErr } = await supabaseAdmin
        .from('course_modules')
        .select('*')
        .eq('webinar_id', source.id)
        .order('sort_order', { ascending: true })
      if (modErr) throw modErr

      for (const m of sourceModules ?? []) {
        const next = { webinar_id: created.id }
        for (const f of MODULE_FIELDS) next[f] = m[f]
        const { data: newModule, error: insModErr } = await supabaseAdmin
          .from('course_modules')
          .insert(next)
          .select('id')
          .single()
        if (insModErr) {
          warnings.push(`Could not copy the module "${m.title}": ${insModErr.message}`)
          continue
        }
        moduleIdMap.set(m.id, newModule.id)
        modulesCopied += 1
      }

      const { data: sourceQuestions, error: qErr } = await supabaseAdmin
        .from('quiz_questions')
        .select('*')
        .eq('webinar_id', source.id)
        .order('sort_order', { ascending: true })
      if (qErr) throw qErr

      if (sourceQuestions?.length) {
        const qRows = sourceQuestions.map((q) => {
          const next = { webinar_id: created.id }
          for (const f of QUIZ_FIELDS) next[f] = q[f]
          return next
        })
        const { error: insQErr } = await supabaseAdmin.from('quiz_questions').insert(qRows)
        if (insQErr) warnings.push(`Could not copy the quiz questions: ${insQErr.message}`)
        else questionsCopied = qRows.length
      }
    }

    if (!copyContent) return done()

    // ---- Copy content items ---------------------------------------------
    const { data: sourceItems, error: itemsErr } = await supabaseAdmin
      .from('webinar_content')
      .select('*')
      .eq('webinar_id', source.id)
      .order('sort_order', { ascending: true })
    if (itemsErr) throw itemsErr

    if (!sourceItems?.length) return done()

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
      // Follow the attachment to its copied module. A module that failed to
      // copy leaves this null, which parks the file in the course-wide
      // resources rather than pointing it at the original course's module.
      next.module_id = item.module_id ? moduleIdMap.get(item.module_id) ?? null : null
      // Recordings belong to the session that was cloned. Keep the row so the
      // structure survives, but leave the file for the admin to attach.
      next.file_url =
        !includeRecordings && item.type === 'recording' ? null : await resolveFileUrl(item)
      rows.push(next)
    }

    const { error: contentErr } = await supabaseAdmin.from('webinar_content').insert(rows)
    if (contentErr) {
      warnings.push(`The workshop was created but its content could not be copied: ${contentErr.message}`)
      return done({ files_copied: filesCopied })
    }

    return done({ content_copied: rows.length, files_copied: filesCopied })
  } catch (err) {
    console.error('clone-workshop error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
