// Pure helpers shared by the public survey API and the admin editor.
// No DB calls; safe to import from both server and browser bundles.

export const QUESTION_TYPES = [
  'nps',
  'single_select',
  'multi_select',
  'short_text',
  'long_text',
]

const MAX_TEXT_LEN = 2000
const MAX_SHORT_TEXT_LEN = 200
const MAX_OPTIONS = 30
const MAX_QUESTIONS = 40

// The original 022 migration created typed columns (nps_score, years_teaching,
// valuable_sections, rushed_section, length_feedback, share_permission, plus
// the text fields) each with a CHECK constraint enumerating allowed values.
// We previously dual-wrote to those columns from the new code path, but the
// CHECK constraints are brittle (any whitespace / smart-quote drift between
// the JS strings and the DB definition fails the insert) and the new
// analytics path reads from the `responses` jsonb via normalizeRowResponses
// anyway. So new submissions write to jsonb only; the typed columns stay
// nullable and exist purely to keep historical pre-migration-025 PP-101 rows
// readable.

function isString(v) {
  return typeof v === 'string'
}

function trimString(v) {
  return isString(v) ? v.trim() : ''
}

export function validateSurveyConfig(config) {
  if (!config || typeof config !== 'object') {
    return { error: 'survey_config is missing or invalid' }
  }
  const { enabled, opens_at, closes_at, questions } = config
  if (typeof enabled !== 'boolean') {
    return { error: 'survey_config.enabled must be a boolean' }
  }
  if (!opens_at || Number.isNaN(Date.parse(opens_at))) {
    return { error: 'survey_config.opens_at must be a valid ISO timestamp' }
  }
  if (!closes_at || Number.isNaN(Date.parse(closes_at))) {
    return { error: 'survey_config.closes_at must be a valid ISO timestamp' }
  }
  if (Date.parse(closes_at) <= Date.parse(opens_at)) {
    return { error: 'survey_config.closes_at must be after opens_at' }
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    return { error: 'survey_config.questions must be a non-empty array' }
  }
  if (questions.length > MAX_QUESTIONS) {
    return { error: `survey_config.questions exceeds limit of ${MAX_QUESTIONS}` }
  }

  const seenIds = new Set()
  for (const [i, q] of questions.entries()) {
    if (!q || typeof q !== 'object') {
      return { error: `Question ${i + 1} is malformed` }
    }
    if (!isString(q.id) || !q.id.trim()) {
      return { error: `Question ${i + 1} is missing an id` }
    }
    if (seenIds.has(q.id)) {
      return { error: `Duplicate question id: ${q.id}` }
    }
    seenIds.add(q.id)
    if (!QUESTION_TYPES.includes(q.type)) {
      return { error: `Question ${q.id} has unknown type: ${q.type}` }
    }
    if (!isString(q.label) || !q.label.trim()) {
      return { error: `Question ${q.id} is missing a label` }
    }
    if (q.type === 'single_select' || q.type === 'multi_select') {
      if (!Array.isArray(q.options) || q.options.length === 0) {
        return { error: `Question ${q.id} needs at least one option` }
      }
      if (q.options.length > MAX_OPTIONS) {
        return { error: `Question ${q.id} exceeds ${MAX_OPTIONS} options` }
      }
      const seenOptions = new Set()
      for (const opt of q.options) {
        if (!isString(opt) || !opt.trim()) {
          return { error: `Question ${q.id} has an empty option` }
        }
        if (seenOptions.has(opt)) {
          return { error: `Question ${q.id} has duplicate option: ${opt}` }
        }
        seenOptions.add(opt)
      }
    }
  }
  return { ok: true }
}

// Validate a submitted responses payload against a survey config.
// Returns { responses } on success (cleaned) or { error } on failure.
export function validateResponses(config, rawResponses) {
  const configCheck = validateSurveyConfig(config)
  if (configCheck.error) return configCheck

  if (!rawResponses || typeof rawResponses !== 'object' || Array.isArray(rawResponses)) {
    return { error: 'responses must be an object keyed by question id' }
  }

  const cleaned = {}
  for (const q of config.questions) {
    const raw = rawResponses[q.id]
    const present =
      raw !== undefined &&
      raw !== null &&
      !(isString(raw) && raw.trim() === '') &&
      !(Array.isArray(raw) && raw.length === 0)

    if (!present) {
      if (q.required) return { error: `Please answer: ${q.label}` }
      continue
    }

    switch (q.type) {
      case 'nps': {
        const n = typeof raw === 'number' ? raw : Number(raw)
        if (!Number.isInteger(n) || n < 1 || n > 10) {
          return { error: `${q.label}: pick a number from 1 to 10` }
        }
        cleaned[q.id] = n
        break
      }
      case 'single_select': {
        const v = trimString(raw)
        if (!q.options.includes(v)) {
          return { error: `${q.label}: invalid option` }
        }
        cleaned[q.id] = v
        break
      }
      case 'multi_select': {
        if (!Array.isArray(raw)) {
          return { error: `${q.label}: expected a list of options` }
        }
        const seen = new Set()
        const items = []
        for (const item of raw) {
          const v = trimString(item)
          if (!q.options.includes(v)) {
            return { error: `${q.label}: invalid option` }
          }
          if (!seen.has(v)) {
            seen.add(v)
            items.push(v)
          }
        }
        if (items.length === 0) {
          if (q.required) return { error: `${q.label}: select at least one` }
          break
        }
        cleaned[q.id] = items
        break
      }
      case 'short_text': {
        const v = trimString(raw)
        if (v.length > MAX_SHORT_TEXT_LEN) {
          return { error: `${q.label}: response is too long (max ${MAX_SHORT_TEXT_LEN} characters)` }
        }
        cleaned[q.id] = v
        break
      }
      case 'long_text': {
        const v = trimString(raw)
        if (v.length > MAX_TEXT_LEN) {
          return { error: `${q.label}: response is too long (max ${MAX_TEXT_LEN} characters)` }
        }
        cleaned[q.id] = v
        break
      }
      default:
        return { error: `Unsupported question type: ${q.type}` }
    }
  }
  return { responses: cleaned }
}

// Kept as a no-op for backward compatibility with any callers still
// importing it. New rows write to the responses jsonb only; see the
// comment block above for rationale.
export function legacyColumnMirror() {
  return {}
}

// Given a row from workshop_feedback, return a unified responses map
// keyed by question id, merging the jsonb `responses` with the legacy
// typed columns. Typed columns win for PP-101 historical rows that have
// no jsonb payload; jsonb wins for everything new.
export function normalizeRowResponses(row) {
  const fromJsonb = row.responses && typeof row.responses === 'object' ? { ...row.responses } : {}
  const typed = {}
  if (row.years_teaching != null) typed.years_teaching = row.years_teaching
  if (row.nps_score != null) typed.nps_score = row.nps_score
  if (row.change_this_week != null) typed.change_this_week = row.change_this_week
  if (row.aha_moment != null) typed.aha_moment = row.aha_moment
  if (Array.isArray(row.valuable_sections)) typed.valuable_sections = row.valuable_sections
  if (row.rushed_section != null) typed.rushed_section = row.rushed_section
  if (row.confusing != null) typed.confusing = row.confusing
  if (row.length_feedback != null) typed.length_feedback = row.length_feedback
  if (row.share_permission != null) typed.share_permission = row.share_permission
  if (row.next_workshop_topic != null) typed.next_workshop_topic = row.next_workshop_topic
  if (row.anything_else != null) typed.anything_else = row.anything_else
  return { ...typed, ...fromJsonb }
}
