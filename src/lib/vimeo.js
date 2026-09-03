// Vimeo share URLs, parsed once and used in two places: the admin validates
// what was pasted into a module, and the portal player builds an embed src
// from the same result. Keeping it here means those two can never disagree
// about what counts as a valid URL.
//
// Unlisted Vimeo videos carry a privacy hash. It is part of the URL, and the
// embed will not play without it, so it has to survive parsing.

const PATTERNS = [
  // https://player.vimeo.com/video/123456789?h=abcdef1234
  /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
  // https://vimeo.com/123456789/abcdef1234  (share URL for an unlisted video)
  // https://vimeo.com/123456789            (public)
  // https://vimeo.com/channels/staffpicks/123456789
  // https://vimeo.com/groups/name/videos/123456789
  /^https?:\/\/(?:www\.)?vimeo\.com\/(?:channels\/[\w-]+\/|groups\/[\w-]+\/videos\/|manage\/videos\/)?(\d+)/i,
]

/**
 * Pull the numeric id and privacy hash out of any Vimeo URL shape we accept.
 *
 * @param {string} url
 * @returns {{ id: string, hash: string | null } | null} null when it is not a
 *   Vimeo URL we recognise, so callers can show an error rather than render a
 *   dead player.
 */
export function parseVimeoUrl(url) {
  if (typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null

  let id = null
  for (const re of PATTERNS) {
    const m = trimmed.match(re)
    if (m) {
      id = m[1]
      break
    }
  }
  if (!id) return null

  return { id, hash: extractHash(trimmed, id) }
}

// The hash arrives one of two ways: as ?h= on a player URL, or as the path
// segment straight after the id on a share URL. A bare id with no hash is
// valid; it just means the video is public.
function extractHash(url, id) {
  const query = url.split('?')[1]
  if (query) {
    const h = new URLSearchParams(query).get('h')
    if (h && /^[0-9a-z]+$/i.test(h)) return h
  }

  const path = url.split('?')[0]
  const after = path.split(`/${id}/`)[1]
  if (after) {
    const segment = after.split('/')[0]
    // Guard against /123456789/settings and similar non-hash segments.
    if (/^[0-9a-f]{6,}$/i.test(segment)) return segment
  }

  return null
}

/**
 * Player embed src. Chrome stripped back, and dnt=1 so Vimeo does not track
 * our viewers.
 *
 * @param {{ id: string, hash?: string | null }} video
 * @param {{ api?: boolean }} [opts] api=1 is needed to receive the player's
 *   postMessage events, which is how the course marks a module watched.
 */
export function vimeoEmbedSrc({ id, hash }, { api = false } = {}) {
  const params = new URLSearchParams({
    badge: '0',
    autopause: '0',
    title: '0',
    byline: '0',
    portrait: '0',
    dnt: '1',
  })
  if (hash) params.set('h', hash)
  if (api) params.set('api', '1')
  return `https://player.vimeo.com/video/${id}?${params}`
}

/**
 * Public thumbnail endpoint. No API key and no auth, but it only answers for
 * videos whose privacy allows embedding, which makes a failed lookup a useful
 * signal in the admin: the URL parsed, yet the video will not embed.
 */
export function vimeoOEmbedUrl(url, { width = 320 } = {}) {
  return `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=${width}`
}
