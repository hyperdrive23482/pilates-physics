/**
 * PostHog client and config. The single place that imports `posthog-js`, so
 * components use the helpers below and never the SDK directly.
 *
 * Loaded with a dynamic import so the ~220 kB SDK stays out of the entry chunk
 * and off the critical path of a first paint. `initPostHog()` fires from an
 * effect in App; anything captured before the module lands is queued and
 * flushed once it does, so callers never think about timing.
 *
 * Traffic goes through our own domain via the `/ingest` rewrite in vercel.json
 * so ad and tracking blockers do not silently drop analytics.
 *
 * DECIDED 2026-10-14 (docs/admin-analytics-engine-plan.md, section 4.1):
 *   - persistence is localStorage, not cookies. The site sets no cookies and
 *     runs no consent banner on legitimate-interest grounds; this keeps that
 *     position intact while giving each browser a stable anonymous id, which
 *     the pre-lead journey in the Funnel page needs.
 *   - session replay is off. Nothing here records screens.
 *   - exception capture is off. Errors are not analytics.
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY
const HOST = import.meta.env.VITE_POSTHOG_HOST ?? '/ingest'

let client = null
let loading = null

/** Work queued before posthog-js finished loading. */
let pending = []

function run(fn) {
  if (client) {
    fn(client)
    return
  }
  // No init attempt yet, or analytics is off in this environment: drop it.
  if (loading) pending.push(fn)
}

/**
 * Load and initialize PostHog. Safe to call more than once. Resolves to null
 * when VITE_POSTHOG_KEY is absent (local dev, previews without the var) or the
 * module fails to load, so analytics being unavailable never breaks a page.
 */
export function initPostHog() {
  if (loading) return loading
  if (!KEY || typeof window === 'undefined') {
    loading = Promise.resolve(null)
    pending = []
    return loading
  }

  loading = import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        ui_host: 'https://us.posthog.com',
        // Modern SDK defaults, including history-based pageview capture, so
        // every react-router navigation is a $pageview.
        defaults: '2026-05-30',
        // Person profiles only for signed-in people. Anonymous visitors stay
        // as anonymous events, which is both cheaper and the honest shape.
        person_profiles: 'identified_only',
        persistence: 'localStorage',
        disable_session_recording: true,
        capture_exceptions: false,
        // The site has no third-party iframes worth tracking and no forms
        // whose contents should ever reach PostHog.
        autocapture: false,
      })

      client = posthog
      for (const fn of pending) fn(posthog)
      pending = []
      return posthog
    })
    .catch(() => {
      pending = []
      return null
    })

  return loading
}

/** Whether PostHog is configured and running (false in keyless local dev). */
export function isPostHogEnabled() {
  return client !== null
}

/**
 * Fire-and-forget custom event. No-op when PostHog is not configured, so
 * callers never guard. Keep properties free of personal data: slugs, counts,
 * flags. Never an email or a name.
 */
export function captureEvent(event, properties) {
  run((ph) => ph.capture(event, properties))
}

/**
 * Tie subsequent events to a signed-in person. The distinct id IS the Supabase
 * user id; api/_lib/posthog.js relies on that to join our tables to PostHog
 * persons.
 */
export function identifyUser(userId) {
  run((ph) => {
    ph.opt_in_capturing()
    ph.identify(userId)
  })
}

/** Stop capturing entirely for this browser. Used for admin accounts so
 *  Kaleen's own browsing never counts as traffic. */
export function optOutCapturing() {
  run((ph) => ph.opt_out_capturing())
}

/** Back to a fresh anonymous id, on sign-out. */
export function resetUser() {
  run((ph) => ph.reset())
}
