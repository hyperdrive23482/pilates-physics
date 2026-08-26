# Activity Logging Build Plan (revised)

A durable, append-only record of who signs in, from where, and what they open.

**Primary purpose: chargeback evidence.** Card networks ask for IP addresses, timestamps, and recorded activity. `auth.audit_log_entries` is pruned by Supabase and was empty when we needed it during a Mastercard 4837 dispute. Product analytics is a secondary read of the same rows.

Status: **Phase 3 built, unverified. Phase 2 built, unverified. Phase 1 verified on staging, 2026-08-26.** Migration `042` applied; `login`, `portal_view`, and `certificate_download` all confirmed writing real client IPs, email snapshots, and server-verified `entitled` flags. `tool_open` and `checkout_start` are deployed but not yet exercised. Migrations `042` and `043` are applied to stage; neither is on prod.

All three §7 open items were folded into Phase 2. One Phase 2 item is deferred: the `auth.audit_log_entries` mirror, which is still waiting on the count query in §1.

Debugging note for next time: client events are silent by design, so when they go missing the cause is usually environmental rather than a code bug. During the first verification pass three things stacked up: the branch was not merged so staging had no `/api/track`; then a long-lived browser tab kept running the pre-deploy bundle, because React Router route changes never re-fetch JS. The console named a bundle hash that no longer existed on the server, which is what gave it away. Check `curl -sI` on the deployment and the bundle hash in the console before suspecting the instrumentation.

The original brief that produced this plan is preserved in the appendix at the bottom.

---

## 1. Design decisions, and what changed from the original brief

### One wide table. Confirmed.

Several narrow tables would be right at millions of rows per day. At a few hundred users, the thing to optimize for is **a single chronological read for one person**, because that is literally the shape of Stripe's "Access activity log" evidence field. A union across five tables to build one timeline is the wrong trade.

### Six changes to the proposed schema

| # | Change | Why |
|---|---|---|
| 1 | **No FK on `content_id`** | The admin content manager (migration `012`) deletes and re-creates `webinar_content` rows. With `on delete set null` the evidence row survives but forgets *what* was opened. Bare `uuid`, no FK, plus a denormalized `content_title` in metadata. Same reasoning behind `webinar_slug` sitting next to the `webinar_id` FK. |
| 2 | **Add `source` (`'server' \| 'client'`)** | A `tool_open` written inside `api/portal/animation.js` was *observed*. A `content_click` POSTed by a browser was *asserted by an authenticated client* — the JWT proves who, not what. Both get presented to Stripe, but we should be able to tell them apart. Not backfillable, which is why it exists from day one. |
| 3 | **Add `entitled` boolean** | On every client-asserted event carrying a `webinar_id`, the track endpoint independently re-checks `user_entitlements` server-side and records the result. A client-asserted event then still carries a server-verified authorization fact. This is what closes most of the gap between "writes are server-side only" and the reality that some events must originate in the browser. |
| 4 | **Index on `lower(email)`** | After account deletion `user_id` is null and email is the only remaining handle. Stripe hands us an email in a dispute, so email is the actual entry point to the query. |
| 5 | **Append-only enforced by trigger, not just RLS** | RLS with no INSERT policy stops the browser, but the service role bypasses RLS entirely — nothing otherwise stops a stray `supabaseAdmin.update()`. The trigger blocks all UPDATEs and blocks DELETEs of rows inside the retention window, so the Phase 3 pruning job can still run. |
| 6 | **Validate the IP before it hits `inet`** | A malformed value fails the cast and costs the row. Worth keeping `inet` rather than `text`: it enables `<<=` subnet queries, and *"the login IPs are on the same /24 as the IP that ran the checkout"* is the sentence that wins a 4837. |

### The IP header was wrong

`x-forwarded-for` first entry is the one a **client** can forge by sending its own `X-Forwarded-For` header. Correct precedence on Vercel:

1. `x-real-ip` (set by Vercel's edge)
2. `x-vercel-forwarded-for` (set by Vercel's edge)
3. first entry of `x-forwarded-for` (last resort, validated)

### `api/springs101.js` is not a "tool open" endpoint

It is the lead-magnet **claim/signup** endpoint. It fires once, usually while anonymous, and grants the Spring Load Calculator entitlement. Still worth logging — a pre-purchase touchpoint with an IP helps establish a relationship predating the charge — but as `lead_magnet_claim`, not `tool_open`. Phase 2.

### Only 10 of 14 tools are server-side

`src/components/portal/ToolHost.jsx` registers 14 slugs. The ten `animation-*` ones fetch through `api/portal/animation.js`. These four are pure client React components that make **no server call at all**:

- `spring-load-calculator`
- `springs-101`
- `reformer-force-modeler`
- `class-simulator`

Do not bolt fake server calls onto them. Use the `entitled` re-check and accept `source: 'client'`.

### Two server-side events worth more than most of the original list

**`checkout_start` in `api/checkout/create-session.js`.** The biggest omission in the original plan. For a "cardholder did not authorize this" claim, the strongest artifact available is the IP that *initiated the purchase*, compared against the IPs that logged in afterward. Stripe will not reliably surface the session-creation IP. Our own endpoint has it in the request headers and currently discards it. Four lines. **Phase 1.**

**`certificate_download` in `api/certificate/[workshopId].js`.** Fully server-side, entitlement-gated, and it generates a PDF with the customer's own name on it. People whose cards were stolen do not download CEC certificates. The original plan pointed at `useCertificateDownload.js` (the client hook); instrument the endpoint instead. Eight lines. **Phase 1.**

Downloads through `ContentItem` genuinely cannot be server-side: it signs a Storage URL with the anon key and never touches our API. Proxying those through a function is a real rewrite for a weak evidence gain. Fire a client event, mark it `source: 'client'`, move on.

### Supabase Auth Hooks: no

The available hooks are Send Email, Send SMS, Custom Access Token, MFA Verification, and Password Verification. The Custom Access Token hook is the only one near a sign-in, and it is wrong on both counts:

- It fires on **every token refresh**, which is exactly the flooding the explicit client-fired approach avoids.
- It does **not receive the client IP**. It is a Postgres function with no request context.

It would cost a hook on the critical auth path for strictly less information.

The authoritative source with IPs is `auth.audit_log_entries`, which does record `ip_address` per sign-in. Ours read empty, which is either Supabase's pruning or the fact that the `auth` schema is not exposed through PostgREST, so `supabaseAdmin.from(...)` cannot see it. **Verify which before Phase 2:**

```bash
psql "$DATABASE_URL" -c "select count(*), min(created_at), max(created_at) from auth.audit_log_entries;"
```

If it is populating, add a nightly Vercel cron (one already exists at `api/cron/publish-scheduled`) that mirrors new rows into `activity_events` as `source: 'server'`. That would be the highest-authority login record available, and it would survive Supabase's pruning. Phase 2, contingent on the check above.

### Deduplication: read time, not write time

Collapsing is right for analytics and **wrong for evidence**. "Logged in 47 times across five months" is a far stronger sentence than "12 distinct sessions", and any write-time collapsing destroys information that cannot be reconstructed. At this volume, even 200 events per user per year is nothing.

**Rule: write everything. Aggregate in the analytics query with `date_trunc`.**

The one exception is a **60-second server-side suppression** on the exact tuple `(user_id, event_type, webinar_id, content_id)`. That window exists purely to kill mechanical duplicates — React StrictMode double-mounts, double-clicks, reload races — not to model sessions. It is short enough that a genuine "came back an hour later" is always recorded.

- Evidence cost of a 60s window: zero.
- Analytics benefit of a longer window: a `GROUP BY` that can be written later.

---

## 2. Codebase gotchas

Four things that will make this harder than it looks.

**1. `ContentItem` has no `webinar_id`, and one call site passes a non-UUID id.**
`src/pages/WorkshopPortal.jsx:271` renders a synthetic item with `id: 'main-recording'` for the `workshop.recording_url` fallback. That fails a `uuid` cast. `webinar_id` needs threading down as a prop to all four `ContentItem` call sites, and `content_id` needs a UUID guard before it is sent. (Phase 2.)

**2. `hasAccess` from `useEntitlements` is a new function identity on every render.**
It cannot go in a `useEffect` dep array without firing the effect every render. Use a ref keyed on the workshop id instead. Handled in the Phase 1 diff below.

**3. "Fire and forget" does not work on Vercel serverless.**
A promise left unawaited can be dropped when the function freezes after responding, and the row silently never lands. On the **server**, `logActivity(...)` must be awaited. Fire-and-forget applies to the **browser** side only. In `animation.js` it is placed after the file read so the cost is a single insert.

**4. `AuthCallback` navigates immediately after the session lands.**
A plain `fetch` can be aborted by the unmount. The client helper uses `keepalive: true` and accepts an explicit token override, because reading the session back out of storage right after `verifyOtp` resolves is a race.

---

## 3. Phase 1 — the durable record

Six files. Nothing here depends on any admin UI existing.

### 3.1 New: `supabase/migrations/042_activity_events.sql`

```sql
-- ============================================================
-- Pilates Physics: Activity Events
-- Append-only record of who signed in, from where, and what they opened.
--
-- Primary purpose is evidence: card-network chargeback disputes ask for IP
-- addresses, timestamps, and recorded activity, and auth.audit_log_entries is
-- pruned by Supabase. Product analytics is a secondary read of the same rows.
--
-- Written ONLY by the service role (see api/_lib/log-activity.js). There is
-- deliberately no INSERT policy: a browser-writable audit log is spoofable and
-- worthless as evidence. Follows the stripe_events pattern in 003.
-- ============================================================

create table public.activity_events (
  id bigserial primary key,

  -- Identity. ON DELETE SET NULL, never cascade: evidence has to outlive the
  -- account. `email` is a snapshot written server-side from the verified JWT,
  -- never from a request body, so a deleted user's trail stays attributable.
  user_id uuid references auth.users(id) on delete set null,
  email text,

  event_type text not null check (event_type in (
    'login',
    'portal_view',
    'dashboard_view',
    'content_click',
    'tool_open',
    'download',
    'certificate_download',
    'checkout_start',
    'purchase',
    'entitlement_granted',
    'lead_magnet_claim'
  )),

  -- 'server' = observed entirely inside a serverless function.
  -- 'client' = asserted by an authenticated browser; the JWT proves WHO, not
  -- WHAT. Kept distinct so evidence can be weighted honestly rather than
  -- overclaimed. Not backfillable, which is why it exists from day one.
  source text not null check (source in ('server', 'client')),

  -- No FK on content_id: the admin content manager deletes and re-creates
  -- webinar_content rows, and an evidence row must not forget what was opened
  -- when it does. Same reason webinar_slug is denormalized next to the FK.
  webinar_id uuid references public.webinars(id) on delete set null,
  webinar_slug text,
  content_id uuid,
  tool_slug text,

  -- True when the server independently re-verified an active entitlement for
  -- webinar_id at write time. Null when the event carried no webinar_id.
  -- This is what makes a client-asserted event carry a server-verified fact.
  entitled boolean,

  -- Query strings are stripped before storage: magic-link token_hash and
  -- OAuth codes travel there and must never land in a log.
  path text,

  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

-- The dispute query: one person's timeline, newest first.
create index idx_activity_events_user_time
  on public.activity_events (user_id, created_at desc);

-- After account deletion user_id is null and email is the only handle left.
-- Stripe hands you an email in a dispute, so this is the real entry point.
create index idx_activity_events_email_time
  on public.activity_events (lower(email), created_at desc);

create index idx_activity_events_type_time
  on public.activity_events (event_type, created_at desc);

create index idx_activity_events_webinar_time
  on public.activity_events (webinar_id, created_at desc);

create index idx_activity_events_content
  on public.activity_events (content_id) where content_id is not null;

-- ============================================================
-- Append-only enforcement
--
-- RLS with no INSERT/UPDATE/DELETE policy blocks the browser, but the service
-- role bypasses RLS entirely, so a stray supabaseAdmin.update() would go
-- through. This trigger is the actual guarantee.
--
-- DELETE is permitted only past the retention horizon, so the Phase 3 pruning
-- job can run while nothing can quietly erase live evidence.
-- ============================================================

create or replace function public.activity_events_append_only()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    raise exception 'activity_events is append-only: UPDATE is not permitted';
  end if;
  if old.created_at > now() - interval '26 months' then
    raise exception
      'activity_events: cannot delete rows inside the 26-month retention window';
  end if;
  return old;
end;
$$;

create trigger activity_events_append_only
  before update or delete on public.activity_events
  for each row execute function public.activity_events_append_only();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.activity_events enable row level security;

-- Admin read only. No INSERT policy on purpose: all writes go through the
-- service role in api/_lib/log-activity.js, which verifies a JWT first.
create policy "Admins read activity" on public.activity_events for select
  using (public.is_admin());
```

### 3.2 New: `api/_lib/log-activity.js`

```js
import { supabaseAdmin } from './supabase-admin.js'

const MAX_TEXT = 512
const MAX_PATH = 200

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/

function isIp(value) {
  if (!value) return false
  if (IPV4_RE.test(value)) {
    return value.split('.').every((octet) => Number(octet) <= 255)
  }
  // Loose IPv6 check. Postgres inet does the real validation; this only has to
  // keep obvious junk from failing the insert and costing us the row.
  return value.includes(':') && /^[0-9a-fA-F:.]+$/.test(value)
}

// Vercel's edge sets x-real-ip and x-vercel-forwarded-for itself, so both are
// authoritative. x-forwarded-for is the last resort: only its FIRST entry is
// the client, and that entry is also the one a client can forge by sending the
// header itself, which is why everything is validated before use.
export function clientIp(req) {
  const candidates = [
    req.headers['x-real-ip'],
    req.headers['x-vercel-forwarded-for'],
    String(req.headers['x-forwarded-for'] ?? '').split(',')[0],
  ]
  for (const candidate of candidates) {
    const ip = typeof candidate === 'string' ? candidate.trim() : ''
    if (isIp(ip)) return ip
  }
  return null
}

// Query strings carry magic-link token_hash values and OAuth codes. Never
// store them: constraint #6 of the logging design.
export function safePath(value) {
  if (typeof value !== 'string' || !value) return null
  return value.split('?')[0].split('#')[0].slice(0, MAX_PATH)
}

function trim(value, max = MAX_TEXT) {
  return typeof value === 'string' && value ? value.slice(0, max) : null
}

// Append one row to the activity log. NEVER throws: a logging failure must not
// fail the request it is observing.
//
// IMPORTANT: callers must AWAIT this. On Vercel a promise left unawaited can be
// dropped when the function freezes after responding, and the row silently
// never lands. Overlap it with other work (Promise.all) if latency matters.
// Fire-and-forget is a browser-side pattern only — see src/lib/track.js.
export async function logActivity(req, event) {
  try {
    const { error } = await supabaseAdmin.from('activity_events').insert({
      user_id: event.userId ?? null,
      email: event.email ? String(event.email).toLowerCase().slice(0, 320) : null,
      event_type: event.eventType,
      source: event.source ?? 'server',
      webinar_id: event.webinarId ?? null,
      webinar_slug: trim(event.webinarSlug, 128),
      content_id: event.contentId ?? null,
      tool_slug: trim(event.toolSlug, 128),
      entitled: typeof event.entitled === 'boolean' ? event.entitled : null,
      path: safePath(event.path),
      ip_address: clientIp(req),
      user_agent: trim(req.headers['user-agent']),
      metadata: event.metadata ?? {},
    })
    if (error) console.error('logActivity insert failed:', error.message)
  } catch (err) {
    console.error('logActivity error:', err)
  }
}
```

### 3.3 New: `api/track.js`

```js
import { supabaseAdmin } from './_lib/supabase-admin.js'
import { requireUser } from './_lib/require-user.js'
import { logActivity, safePath } from './_lib/log-activity.js'

// Event types a browser is allowed to assert. Server-only types
// (tool_open, checkout_start, certificate_download, purchase, ...) are
// deliberately absent: only server code may write those, so a client can never
// manufacture the strongest class of evidence.
const CLIENT_EVENTS = new Set([
  'login',
  'portal_view',
  'dashboard_view',
  'content_click',
  'download',
])

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Collapses mechanical duplicates only — StrictMode double-mounts, double
// clicks, reload races. Deliberately short: a genuine repeat visit an hour
// later is real evidence and must be recorded. Session-level rollup is an
// analytics-time GROUP BY, not a write-time decision.
const DEDUP_WINDOW_SECONDS = 60

const META_KEYS = ['method', 'content_type', 'content_title', 'label']

function sanitizeMetadata(input) {
  if (!input || typeof input !== 'object') return {}
  const out = {}
  for (const key of META_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value) out[key] = value.slice(0, 200)
  }
  return out
}

const uuidOrNull = (value) => (UUID_RE.test(String(value ?? '')) ? value : null)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = await requireUser(req, res)
  if (!auth) return
  const { user } = auth

  const body = req.body ?? {}
  const eventType = body.event_type
  if (!CLIENT_EVENTS.has(eventType)) {
    return res.status(400).json({ error: 'Unknown event type' })
  }

  const webinarId = uuidOrNull(body.webinar_id)
  const contentId = uuidOrNull(body.content_id)

  try {
    // Independently re-verify entitlement. The browser says "I opened X"; the
    // server confirms this account was actually allowed to. That is what keeps
    // a client-asserted event worth something as evidence.
    let entitled = null
    let webinarSlug = null
    if (webinarId) {
      const [workshopRes, entRes] = await Promise.all([
        supabaseAdmin.from('webinars').select('slug').eq('id', webinarId).maybeSingle(),
        supabaseAdmin
          .from('user_entitlements')
          .select('id, expires_at')
          .eq('user_id', user.id)
          .eq('webinar_id', webinarId)
          .maybeSingle(),
      ])
      webinarSlug = workshopRes.data?.slug ?? null
      const ent = entRes.data
      entitled =
        user.user_metadata?.is_admin === true ||
        (!!ent && (!ent.expires_at || new Date(ent.expires_at) > new Date()))
    }

    const since = new Date(Date.now() - DEDUP_WINDOW_SECONDS * 1000).toISOString()
    let probe = supabaseAdmin
      .from('activity_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', eventType)
      .gte('created_at', since)
      .limit(1)
    probe = webinarId ? probe.eq('webinar_id', webinarId) : probe.is('webinar_id', null)
    probe = contentId ? probe.eq('content_id', contentId) : probe.is('content_id', null)
    const { data: recent } = await probe
    if (recent?.length) return res.status(204).end()

    await logActivity(req, {
      userId: user.id,
      email: user.email,
      eventType,
      source: 'client',
      webinarId,
      webinarSlug,
      contentId,
      entitled,
      path: safePath(body.path),
      metadata: sanitizeMetadata(body.metadata),
    })

    return res.status(204).end()
  } catch (err) {
    // A tracking failure must never surface to the user. Log and succeed.
    console.error('track error:', err)
    return res.status(204).end()
  }
}
```

### 3.4 New: `src/lib/track.js`

```js
import { supabase } from './supabase'

/**
 * Fire-and-forget activity ping. Never awaited by callers, never throws, never
 * blocks a render — a slow or failed track call must not be visible to a user.
 *
 * keepalive lets the request survive the navigation that usually follows
 * immediately (magic-link callback redirect, download click). accessToken is an
 * escape hatch for the moment right after verifyOtp resolves, where reading the
 * session back out of storage is a race.
 */
export function track(eventType, payload = {}, accessToken = null) {
  ;(async () => {
    try {
      let token = accessToken
      if (!token) {
        const { data: { session } } = await supabase.auth.getSession()
        token = session?.access_token
      }
      if (!token) return

      await fetch('/api/track', {
        method: 'POST',
        keepalive: true,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          path: window.location.pathname,
          ...payload,
        }),
      })
    } catch {
      // Best-effort by design. Swallowed on purpose.
    }
  })()
}
```

### 3.5 Login capture

`src/hooks/useEnrollment.js`:

```diff
 import { useState, useEffect } from 'react'
 import { supabase } from '../lib/supabase'
+import { track } from '../lib/track'
```

```diff
   async function signIn(email, password) {
     const { error } = await supabase.auth.signInWithPassword({
       email: normalizeEmail(email),
       password,
     })
     if (error) throw error
+    // Explicit, not onAuthStateChange SIGNED_IN — that also fires on token
+    // refresh and tab focus and would flood the log. The server verifies the
+    // JWT, so a client can never forge a login for a different account.
+    track('login', { metadata: { method: 'password' } })
   }
```

```diff
   async function verifyEmailCode(email, token) {
     const normalized = normalizeEmail(email)
     const first = await supabase.auth.verifyOtp({ email: normalized, token, type: 'email' })
-    if (!first.error) return
+    if (!first.error) {
+      track('login', { metadata: { method: 'otp' } }, first.data?.session?.access_token)
+      return
+    }
     const second = await supabase.auth.verifyOtp({ email: normalized, token, type: 'magiclink' })
     if (second.error) throw second.error
+    track('login', { metadata: { method: 'otp' } }, second.data?.session?.access_token)
   }
```

`src/pages/AuthCallback.jsx`:

```diff
 import { supabase } from '../lib/supabase'
+import { track } from '../lib/track'
 import ExpiredLinkNotice from '../components/ui/ExpiredLinkNotice'
```

```diff
     function routeUser(event, session) {
+      // Record before navigating. track() uses keepalive so the request
+      // survives the unmount this is about to cause.
+      if (session) {
+        track(
+          'login',
+          { metadata: { method: event === 'PASSWORD_RECOVERY' ? 'recovery' : 'magiclink' } },
+          session.access_token
+        )
+      }
       if (event === 'PASSWORD_RECOVERY') {
```

### 3.6 Portal view and the three server-side events

`src/pages/WorkshopPortal.jsx`:

```diff
-import { useEffect } from 'react'
+import { useEffect, useRef } from 'react'
 import { useParams, useNavigate, Link } from 'react-router-dom'
 import { ArrowLeft } from 'lucide-react'
+import { track } from '../lib/track'
```

```diff
   const { content } = useWorkshopContent(workshop?.id, workshop?.status)
 
+  // Record the visit once per workshop per mount. hasAccess is a fresh closure
+  // every render and cannot go in a dep array, so guard on the id we last sent.
+  const viewLogged = useRef(null)
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/login', { replace: true })
     }
   }, [authLoading, user, navigate])
 
+  useEffect(() => {
+    if (entLoading || !workshop?.id) return
+    if (viewLogged.current === workshop.id) return
+    if (!hasAccess(workshop.id)) return
+    viewLogged.current = workshop.id
+    track('portal_view', { webinar_id: workshop.id })
+  })
+
```

`api/portal/animation.js`:

```diff
 import { readFileSync } from 'node:fs'
 import { join } from 'node:path'
 import { supabaseAdmin } from '../_lib/supabase-admin.js'
+import { logActivity } from '../_lib/log-activity.js'
```

```diff
   const isAdmin = user.user_metadata?.is_admin === true
+  let entitlementVerified = false
```

```diff
   if (!isAdmin) {
     ...
     if (ent.expires_at && new Date(ent.expires_at) <= new Date()) {
       return res.status(403).json({ error: 'Access expired' })
     }
+    entitlementVerified = true
   }
 
   try {
     const dir = join(process.cwd(), 'animations')
     const html = readFileSync(join(dir, SLUG_TO_FILE[slug]), 'utf8')
+    // Highest-quality signal in the system: fully server-observed, after the
+    // entitlement gate. Awaited because an unawaited promise can be dropped
+    // when the Vercel function freezes; one insert, and the file read above
+    // has already happened.
+    await logActivity(req, {
+      userId: user.id,
+      email: user.email,
+      eventType: 'tool_open',
+      source: 'server',
+      webinarId: workshop.id,
+      webinarSlug: workshop.slug,
+      toolSlug: slug,
+      entitled: entitlementVerified ? true : null,
+      metadata: isAdmin ? { admin: 'true' } : {},
+    })
     return res.status(200).json({ html })
```

`api/checkout/create-session.js` — the pre-purchase IP:

```diff
 import { stripe } from '../_lib/stripe.js'
 import { supabaseAdmin } from '../_lib/supabase-admin.js'
+import { logActivity } from '../_lib/log-activity.js'
```

```diff
     })
 
+    // The IP that initiated the purchase. Stripe will not reliably give you
+    // this, and comparing it against later login IPs is the strongest single
+    // artifact against a "cardholder did not authorize" claim.
+    await logActivity(req, {
+      userId: user?.id ?? null,
+      email: resolvedEmail,
+      eventType: 'checkout_start',
+      source: 'server',
+      webinarId: workshop.id,
+      webinarSlug: workshop.slug,
+      metadata: { label: session.id },
+    })
+
     return res.status(200).json({ url: session.url })
```

`api/certificate/[workshopId].js`:

```diff
 import { supabaseAdmin } from '../_lib/supabase-admin.js'
 import { requireUser } from '../_lib/require-user.js'
+import { logActivity } from '../_lib/log-activity.js'
 import { buildCertificate } from '../_lib/build-certificate.js'
```

```diff
       if (ent.expires_at && new Date(ent.expires_at) <= new Date()) {
         return res.status(403).json({ error: 'Access expired' })
       }
     }
 
+    // Server-observed, entitlement-gated, and it produces a PDF with the
+    // customer's own name on it. People whose cards were stolen do not
+    // download CEC certificates. entitled stays null for admins, who bypassed
+    // the check rather than failing it.
+    await logActivity(req, {
+      userId: user.id,
+      email: user.email,
+      eventType: 'certificate_download',
+      source: 'server',
+      webinarId: workshop.id,
+      webinarSlug: workshop.slug,
+      entitled: isAdmin ? null : true,
+      metadata: { label: workshop.title },
+    })
+
```

---

## 4. Verifying Phase 1

The local `.env` has no service-role key, so none of the write path can be exercised locally.

**1. Push the migration.** ✅ Done.

```bash
supabase db push
```

Note for future pushes: `040_instagram_planner.sql` had been applied to the shared database from `feature/insta-planner` while its file existed only on that branch, which made `db push` refuse. The file now lives on this branch too. The CLI's suggested `migration repair --status reverted 040` would have been the wrong fix, since `instagram_posts` genuinely exists and marking it reverted would make the next push from `feature/insta-planner` try to re-create it. `041_instagram_connection` is on neither local nor remote (never pushed) and was deliberately left out.

**2. Confirm the append-only trigger actually bites.** In the Supabase SQL editor. The insert seeds a row and should **succeed**; the update and delete should both **raise**:

```sql
insert into public.activity_events (event_type, source) values ('login','server');
update public.activity_events set path = '/x' where id = (select max(id) from public.activity_events);
delete from public.activity_events where id = (select max(id) from public.activity_events);
```

Every row is inside the 26-month window right now, so no delete can succeed at all until 2028. That is intended. The seed row stays in the table; it is harmless, or remove it later via the Phase 3 retention path.

**3. Deploy the branch to a Vercel preview.** Then exercise, on the preview URL:

- sign in with a password
- sign in with a magic link
- open a workshop portal
- open an `animation-*` tool
- start a checkout (abandon at the Stripe page)
- download a certificate

**4. Read back what landed.**

```sql
select created_at, event_type, source, email, ip_address, entitled,
       webinar_slug, tool_slug, path
from public.activity_events
order by id desc
limit 40;
```

Check specifically:

- `ip_address` is populated and is the **real client IP**, not a Vercel edge address
- `path` on the magic-link row has **no query string**
- `source` is `server` for `tool_open`, `checkout_start`, `certificate_download`
- `login` appears **exactly once per sign-in**, not repeating on tab focus

**5. Separately**, run the `auth.audit_log_entries` count from §1 to decide whether the Phase 2 mirror job is worth building.

---

## 5. Phase 2 — remaining capture, timeline, dispute export

Built 2026-08-26, not yet verified on staging.

**Capture points added**

- `content_click` / `download` in `ContentItem`. One event per click, typed by what the click does: `content_click` for things that open in a tab (recording, link), `download` for everything that resolves to a real file. Fired before the handler's early return so external URLs are captured too. `webinar_id` now threaded through all four call sites in `WorkshopPortal.jsx`, and the synthetic `main-recording` id is UUID-guarded so it lands as null with the label preserved in metadata.
- `tool_open` client-side in `ToolHost.jsx` for the four tools with no server path, skipping `animation-*` so they are not double-counted. Writes `source: 'client'`.
- `lead_magnet_claim` in `api/springs101.js`. Labelled correctly: this endpoint is the claim, not someone using the calculator.
- `purchase` and `entitlement_granted` in the Stripe webhook, with `ip_address` and `user_agent` explicitly null. The request comes from Stripe, so capturing its IP would put an address in the evidence log with no relation to the buyer. No duplicate guard is needed; see the comment in the handler for why a retry can never double-log.

**Open-item fixes folded in**

- `/api/track` renamed to `/api/portal/activity`. Old cached bundles will POST to a path that no longer exists and lose events for the length of one deploy window; acceptable and silent by design.
- `track()` now reads `window.location.pathname` synchronously, so `login` records where the sign-in happened rather than where the redirect landed.

**Admin surfaces**

- `api/admin/user-activity.js` returns account, entitlements, and events for one person. Accepts `user_id` and/or `email`, querying each handle separately and merging rather than interpolating an email into a PostgREST `.or()` filter. Both handles are required for correctness: events written before an account existed (an anonymous `checkout_start`, a lead magnet claim) carry an email with a null `user_id`, and a deleted account leaves email as the only handle at all.
- `src/lib/disputeEvidence.js` formats that payload into plain text for Stripe's `access_activity_log` field: account dates, access granted, a summary (sign-in count over distinct days, distinct IPs, how many events were server-recorded), the full timeline, and a closing note explaining what server-recorded versus browser-reported means and that the log is append-only. All timestamps ISO-8601 UTC.
- `src/components/admin/UserActivityPanel.jsx` renders the timeline inside the expanded user row in `AdminUsers.jsx`, with a "Copy dispute evidence" button. Each row shows its `source` so the distinction stays visible rather than being flattened.
- `last_sign_in_at` surfaced in `api/admin/list-users.js` and shown on the collapsed user row.

**Deferred**

- The `auth.audit_log_entries` mirror cron. Still contingent on the count query in §1, which has not been run.

## 6. Phase 3 — analytics, privacy, retention

Built 2026-08-26. Migration `043` pushed to stage, and its trigger fully verified there:

| | Inside 26 months | Past 26 months |
|---|---|---|
| UPDATE nulling ip_address / user_agent | blocked | allowed |
| UPDATE of any other column | blocked | blocked |
| DELETE | blocked | allowed |

So the append-only claim the dispute export makes is backed by a tested constraint, and the redaction hole opened for the retention job is exactly one field wide. Analytics and the privacy copy remain unverified.

### Retention: 26 months, redact rather than delete

`043_activity_retention.sql` replaces the append-only trigger function from 042. The original blocked every UPDATE, which would also have blocked the redaction this phase depends on. The new version permits a past-horizon UPDATE only when it nulls `ip_address` and `user_agent` and leaves every other column identical, checked field by field. Rows inside the window stay completely immutable, and deletes are still refused inside the window. A partial index supports the sweep's scan.

`api/cron/redact-activity.js` runs daily at 03:30 UTC via `vercel.json`, using the same `CRON_SECRET` check as `publish-scheduled`. It nulls the two fields and never deletes rows, so historical engagement stays countable without holding personal data beyond its stated purpose.

The JS horizon is deliberately two days more conservative than the trigger's `now() - interval '26 months'`. `setUTCMonth` overflows short months (31 March minus one month gives 3 March) where Postgres clamps to 28 February, so without the margin the job could occasionally ask to redact a row the trigger still considers protected.

### Analytics

`api/admin/analytics-summary.js` gains an `engagement` block, rendered by a new section in `AdminAnalytics.jsx`.

The number worth having: **what fraction of buyers ever signed in**. This is computed from `auth.users.last_sign_in_at`, *not* from `activity_events`. Event logging only starts in August 2026, so counting logins from the log would report nearly every existing customer as having never signed in. `last_sign_in_at` covers the whole life of the account.

Content and tools are ranked by **distinct people, not raw hits**, on the grounds that one person replaying a recording ten times is one person who wanted it. Both counts are shown.

Aggregation happens in JS, matching the rest of that handler. That is fine at current volume; the read is capped at 50,000 events and the cap is reported to the UI rather than silently truncating. Move it to a database view if the table outgrows that.

### Privacy policy

`src/pages/Privacy.jsx`, effective date moved to 26 August 2026.

- New "Account activity logs" item in §1, saying plainly that the records are written by our servers rather than the browser, and that the log can be added to but not edited.
- Two new purposes in §2: fraud and dispute defence, and understanding which materials get used.
- §4 states that these logs use no cookies and store nothing on the visitor's device, which is the basis for not showing a consent banner for them.
- §6 states the 26-month period, why it was chosen, and what happens after. It also says explicitly that activity records survive account deletion in unlinked form, because a dispute can arrive long after an account closes.
- New §9 covering UK and EU rights, naming contract performance for service data and legitimate interests for the activity logs, and the right to object. Sections 9 to 11 renumbered to 10 to 12.

### Legal basis, and what remains uncertain

Legitimate interest, with no consent mechanism required. GDPR Recital 47 names fraud prevention explicitly, and nothing here reads or stores anything on the visitor's device, which is what triggers cookie-consent rules.

Still flagged rather than resolved: the analytics reuse is the softer half of that argument and is the part a regulator would press on. Documenting a short Legitimate Interests Assessment would close it. None of this is legal advice.

## 7. Open items from the Phase 1 verification

**1. Rename `/api/track`.** Filter lists (uBlock Origin, AdGuard, EasyPrivacy) commonly block URL paths matching `/track`. This was *not* observed causing a problem during the 2026-08-26 verification — no `ERR_BLOCKED_BY_CLIENT` appeared — so this is a known risk rather than a confirmed one. It matters anyway because the failure mode is silent and invisible: a blocked ping leaves no trace, so a dispute timeline would show a gap indistinguishable from a customer who never logged in, and the customers affected would skew toward the privacy-conscious. Suggested target `/api/portal/activity`, avoiding `track`, `analytics`, `event`, `collect`, `beacon`, `stat`, `pixel`. Touches the file path and the fetch URL in `src/lib/track.js`; the internal `track()` helper name can stay.

**2. `path` on `login` events is imprecise.** Observed `/portal` for a password sign-in that happened on `/login`. `track()` reads `window.location.pathname` inside the async IIFE, after `await getSession()` resolves, by which time the Login page has already navigated. Not evidence-critical (the `event_type` already says what happened) but it is a small inaccuracy in a record meant to be precise. One-line fix: capture the pathname synchronously before the IIFE.

**3. Client-fired `tool_open` for the four client-only tools.** `spring-load-calculator`, `springs-101`, `reformer-force-modeler`, and `class-simulator` make no server call, so Phase 1 gives them no `tool_open` at all. A client-fired event with `source: 'client'` would close the coverage gap for roughly fifteen lines in `ToolHost.jsx`, and the server-side entitlement re-check in the track endpoint already applies. Weaker than the server-observed version, which is exactly what the `source` column exists to record.

## Appendix: original brief

<details>
<summary>The brief this plan was written against</summary>

### Context

This is the Pilates Physics repo: a Vite + React 19 SPA (`src/`) with Vercel serverless functions (`api/`) and Supabase for auth and Postgres (`supabase/migrations/`). Users buy workshops through Stripe, get an account provisioned automatically, and access recordings, downloads, and interactive physics tools in a portal.

I need to build **activity logging**: a durable record of who logs in, what they open, and what they actually use.

Two motivations, and they pull in slightly different directions:

1. **Chargeback defense.** I just fought a "Fraudulent" dispute (Mastercard reason code 4837) and discovered I had almost nothing. `auth.audit_log_entries` was completely empty (Supabase prunes it, and my table had zero rows), so I had no IP addresses and no record that the customer ever opened anything. All I had was `auth.users.last_sign_in_at` plus click data from Kit, my email provider. Evidence for this purpose must be **server-side, unspoofable, timestamped, and retained for years**. Stripe's "Access activity log" evidence field asks specifically for IP addresses, timestamps, and detailed recorded activity.
2. **Product analytics.** I want to know which portal content actually gets used, so I can tell what's worth making more of. Recordings vs downloads vs interactive tools, and which specific ones.

Design for #1 first. #2 falls out of the same data.

### Non-negotiable design constraints

1. **Writes are server-side only.** No RLS insert policy that lets the browser write activity rows. A client-writable log is spoofable and worth nothing as evidence. All writes go through a serverless function that verifies the JWT and writes with the service role.
2. **Capture the IP server-side** from the request headers (`x-forwarded-for` on Vercel, first entry). The browser cannot know its own IP, which is exactly why client-side logging would have failed me here. Store `user_agent` too.
3. **Evidence must survive account deletion.** Do not use `on delete cascade` to `auth.users`. Use `on delete set null` and store a denormalized `email` snapshot on every row, filled server-side from the verified JWT, never from the request body.
4. **Append-only.** No updates, no deletes from application code. Admin read policy only, matching the `stripe_events` pattern.
5. **Never break the page.** Tracking calls are fire-and-forget. A failed or slow track call must never block a render, delay content, or surface an error to the user.
6. **Do not log secrets.** No magic-link tokens, no `token_hash`, no full URLs with query strings that might carry auth params. Strip query strings or whitelist the fields you keep.

### Proposed shape (superseded by §1 above)

A single append-only `public.activity_events` table rather than several narrow ones, with an `event_type` check constraint:

`id` bigserial, `user_id` uuid null references auth.users on delete set null, `email` text (snapshot), `event_type` text not null, `webinar_id` uuid null, `content_id` uuid null, `tool_slug` text null, `path` text null, `ip_address` inet, `user_agent` text, `metadata` jsonb, `created_at` timestamptz not null default now().

Event types to start: `login`, `portal_view`, `content_click`, `tool_open`, `download`. Indexes on `(user_id, created_at desc)` and `(event_type, created_at desc)` at minimum.

### Instrumentation points (superseded by §1 and §3 above)

**Login.** Supabase does not call my API on sign-in, so this has to be triggered client-side and verified server-side. Fire an explicit track call after a session is actually established: in `AuthCallback.jsx` for magic-link sign-ins, and after a successful `signInWithPassword` in `useEnrollment.js`. Do **not** hang this off `onAuthStateChange` `SIGNED_IN` alone, since that also fires on token refresh and tab focus and will flood the table.

**Portal view.** `WorkshopPortal.jsx` on mount, with `webinar_id`.

**Content click.** The `ContentItem` component in `WorkshopPortal.jsx`, with `content_id` and the content `type`.

**Tool open.** Server-side inside `api/portal/animation.js`, after the entitlement check passes. Same for `api/springs101.js`.

**Downloads.** Wherever `useCertificateDownload.js` and the download content items resolve their URLs.

**Deduplication.** A user reloading the portal ten times should not produce ten identical rows an hour apart from a reviewer's perspective, but I also do not want to lose genuine repeat visits.

### Admin surfaces wanted

1. **Per-user activity timeline** on `AdminUsers.jsx`.
2. **Dispute evidence export** — one user, plain-text paste-ready summary formatted for Stripe's "Access activity log" field. The feature most wanted.
3. **Content engagement analytics** on `AdminAnalytics.jsx`.

Plus `last_sign_in_at` in the admin user list.

### Environment constraints

**Migration numbering:** highest on this branch is `039`, but `040_instagram_planner` and `041_instagram_connection` exist on another branch. Start at `042`.

**Local:** `.env` has only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No service-role key locally, so migrations go through `supabase db push` and anything requiring the service role has to be tested against a deployed preview.

</details>
