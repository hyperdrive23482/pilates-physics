// The written SEO recommendations: what the model is shown, what it is asked,
// and the shape it must answer in. Ported from remo's
// supabase/functions/_shared/seo-narrative.ts.
//
// IMPORTS NOTHING. The model call lives in api/_lib/seo/jobs.js; this file is
// the prompt and the schema, so the input can be inspected without the SDK.
//
// WHAT THE MODEL IS FOR. The rules already say what is broken and where. This
// pass reads the same findings next to the traffic and the search queries and
// answers what the rules cannot: given what people search for and which pages
// they land on, which three changes have the most upside, what the titles and
// descriptions should say, and what content is missing.

// Kaleen chose Opus on 2026-10-14: a button press now and then, so quality
// over the roughly $0.20 a run.
export const NARRATIVE_MODEL = 'claude-opus-5-5'

/** List price per million tokens, for the cost line under the button. */
export const NARRATIVE_RATES = { input: 4.0, output: 20.0, cacheWrite: 5.0, cacheRead: 0.2 }

export const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Two or three plain sentences on where the site stands in search right now, from the numbers given. No advice here.',
    },
    top_changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The change, as an imperative sentence. At most three changes in total.' },
          why: { type: 'string', description: 'The upside, tied to a number or finding in the input.' },
          how: { type: 'string', description: 'Concretely what to do, in two to four sentences.' },
          source_files: { type: 'array', items: { type: 'string' }, description: 'Files from the input that own this change.' },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          effort: { type: 'string', enum: ['small', 'medium', 'large'] },
        },
        required: ['title', 'why', 'how', 'source_files', 'impact', 'effort'],
        additionalProperties: false,
      },
    },
    rewrites: {
      type: 'array',
      description: 'At most six. Title and description rewrites for pages where a better snippet would earn more of the impressions they already get, or where the current one is missing, duplicated or the wrong length.',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          current_title: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          proposed_title: { type: 'string', description: '30 to 60 characters including the " | Pilates Physics" suffix.' },
          current_description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          proposed_description: { type: 'string', description: '70 to 160 characters.' },
          reason: { type: 'string' },
        },
        required: ['path', 'current_title', 'proposed_title', 'current_description', 'proposed_description', 'reason'],
        additionalProperties: false,
      },
    },
    content_ideas: {
      type: 'array',
      description: 'At most five. Posts or pages that do not exist and should, each aimed at a query or a gap the input shows.',
      items: {
        type: 'object',
        properties: {
          working_title: { type: 'string' },
          target_query: { type: 'string', description: 'The search phrase this would rank for. A query from the input or a reasoned neighbour of one.' },
          why: { type: 'string' },
          format: { type: 'string', enum: ['blog post', 'landing page section', 'help answer'] },
        },
        required: ['working_title', 'target_query', 'why', 'format'],
        additionalProperties: false,
      },
    },
    caveats: {
      type: 'array',
      items: { type: 'string' },
      description: 'At most four. What the input cannot tell you, stated plainly. Empty if nothing material.',
    },
  },
  required: ['summary', 'top_changes', 'rewrites', 'content_ideas', 'caveats'],
  additionalProperties: false,
}

export const NARRATIVE_SYSTEM = `You advise on search visibility for Pilates Physics (pilatesphysics.com), the education business of Kaleen Canevari, a mechanical engineer and Pilates instructor who designed reformers. The site teaches Pilates teachers the physics of the equipment and the body: live Zoom workshops (Pilates Physics 101 and 102, with NPCP continuing education credits), an on-demand course (How a Reformer Works), a free Spring Load Calculator that is the main lead magnet, a mentorship, and a blog of short essays on mechanics and teaching. The audience is working Pilates instructors, mostly in their first years of teaching. The positioning is that physics is the engine and personalization is the promise: understanding the forces lets a teacher adapt every class to the body in front of them.

You are given the current audit findings for the site, what each page's HTML carries today, thirty days of traffic per page, up to ninety days of Google Search Console queries, and Google's index verdict per page. Everything you say must trace to something in that input: a finding, a page, a query, a number. Do not invent queries, pages, files or figures. Where the data is thin, say so in caveats rather than padding. A young site with little search data is normal; say what to do anyway.

Voice: plain, direct, second person, no marketing language, no exclamation points, and no em dashes anywhere (use periods or commas). Titles you propose end in " | Pilates Physics" and fit 30 to 60 characters including that suffix; descriptions fit 70 to 160. Prefer the fix that removes the most findings for the least work, and name the files it touches using the source_files given. Blog posts are edited in the admin CMS, not in files.

Answer only with the JSON object described by the output schema.`

/** The user turn: the input as JSON, trimmed to what the model needs. */
export function buildNarrativeUserMessage(input) {
  return [
    `Audit of ${input.origin}, generated ${input.generatedAt}.`,
    '',
    '<findings>',
    JSON.stringify(input.findings, null, 1),
    '</findings>',
    '',
    '<pages>',
    JSON.stringify(input.pages, null, 1),
    '</pages>',
    '',
    '<traffic_30d>',
    input.traffic ? JSON.stringify(input.traffic, null, 1) : 'PostHog traffic is not available.',
    '</traffic_30d>',
    '',
    '<search_console>',
    input.search ? JSON.stringify(input.search, null, 1) : 'No Search Console data has been synced yet.',
    '</search_console>',
    '',
    '<index_status>',
    input.index_status.length ? JSON.stringify(input.index_status, null, 1) : 'No URL Inspection results yet.',
    '</index_status>',
  ].join('\n')
}

/** Dollars, from the usage block, at list price. */
export function narrativeCostUsd(usage) {
  if (!usage) return 0
  const m = 1_000_000
  const cost =
    ((usage.input_tokens ?? 0) * NARRATIVE_RATES.input +
      (usage.output_tokens ?? 0) * NARRATIVE_RATES.output +
      (usage.cache_creation_input_tokens ?? 0) * NARRATIVE_RATES.cacheWrite +
      (usage.cache_read_input_tokens ?? 0) * NARRATIVE_RATES.cacheRead) /
    m
  return Math.round(cost * 10_000) / 10_000
}

/** Enforce the limits the schema can only describe, and the shape. */
export function normaliseNarrative(output) {
  if (!output || typeof output.summary !== 'string' || !Array.isArray(output.top_changes)) {
    throw new Error("The model's answer did not match the expected shape.")
  }
  const clean = {
    summary: output.summary,
    top_changes: output.top_changes.slice(0, 3),
    rewrites: (output.rewrites ?? []).slice(0, 6),
    content_ideas: (output.content_ideas ?? []).slice(0, 5),
    caveats: (output.caveats ?? []).slice(0, 4),
  }
  if (clean.top_changes.length === 0) throw new Error('The model returned no changes.')
  return clean
}
