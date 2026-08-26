// Formats one person's activity into plain text for Stripe's "Access activity
// log" evidence field, which asks for IP addresses, timestamps and a record of
// what the customer actually did.
//
// Everything is UTC and ISO-8601 so a reviewer never has to reason about the
// merchant's timezone. Nothing is inferred or embellished: this only restates
// rows from activity_events, because the value of the document is that it is
// boring and checkable.

const EVENT_LABELS = {
  login: 'Signed in',
  portal_view: 'Opened workshop portal',
  dashboard_view: 'Opened account dashboard',
  content_click: 'Opened content',
  download: 'Downloaded file',
  tool_open: 'Used interactive tool',
  certificate_download: 'Downloaded completion certificate',
  checkout_start: 'Started checkout',
  purchase: 'Completed purchase',
  entitlement_granted: 'Access granted',
  lead_magnet_claim: 'Claimed free resource',
}

// Events a browser could not have produced. Called out explicitly because it
// is the distinction a dispute reviewer should care about most.
const SERVER_ONLY = new Set([
  'tool_open',
  'certificate_download',
  'checkout_start',
  'purchase',
  'entitlement_granted',
  'lead_magnet_claim',
])

const ts = (value) => (value ? new Date(value).toISOString().replace('.000', '') : 'unknown')
const day = (value) => new Date(value).toISOString().slice(0, 10)

function describe(event) {
  const label = EVENT_LABELS[event.event_type] ?? event.event_type
  const subject =
    event.metadata?.content_title ||
    event.tool_slug ||
    event.webinar_slug ||
    null
  return subject ? `${label}: ${subject}` : label
}

export function buildDisputeEvidence({ account, entitlements = [], events = [], truncated }) {
  const name = [account?.first_name, account?.last_name].filter(Boolean).join(' ')
  const email = account?.email ?? events.find((e) => e.email)?.email ?? 'unknown'
  const lines = []

  lines.push('ACCESS ACTIVITY LOG')
  lines.push(`Customer: ${name ? `${name} <${email}>` : email}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  lines.push('All times UTC (ISO-8601).')
  lines.push('')

  lines.push('ACCOUNT')
  if (account) {
    lines.push(`  Account created:  ${ts(account.created_at)}`)
    lines.push(`  Last sign-in:     ${ts(account.last_sign_in_at)}`)
  } else {
    lines.push('  Account record no longer present; activity retained below.')
  }
  lines.push('')

  if (entitlements.length) {
    lines.push('ACCESS GRANTED')
    for (const e of entitlements) {
      const title = e.workshop?.title ?? e.webinar_id
      lines.push(`  ${ts(e.granted_at)}  ${title}  (via ${e.source})`)
    }
    lines.push('')
  }

  if (!events.length) {
    lines.push('ACTIVITY')
    lines.push('  No recorded activity.')
    return lines.join('\n')
  }

  const logins = events.filter((e) => e.event_type === 'login')
  const ips = [...new Set(events.map((e) => e.ip_address).filter(Boolean))]
  const loginDays = new Set(logins.map((e) => day(e.created_at)))
  const serverCount = events.filter((e) => SERVER_ONLY.has(e.event_type)).length

  lines.push('SUMMARY')
  lines.push(`  Recorded events:      ${events.length}`)
  lines.push(`  First activity:       ${ts(events[0].created_at)}`)
  lines.push(`  Most recent activity: ${ts(events[events.length - 1].created_at)}`)
  lines.push(`  Sign-ins:             ${logins.length} on ${loginDays.size} separate days`)
  lines.push(`  Distinct IP addresses: ${ips.length}${ips.length ? ` (${ips.join(', ')})` : ''}`)
  lines.push(`  Server-recorded events: ${serverCount} of ${events.length}`)
  lines.push('')

  lines.push('ACTIVITY')
  for (const e of events) {
    const ip = e.ip_address ? `IP ${e.ip_address}` : 'IP not applicable'
    const origin = e.source === 'server' ? 'server-recorded' : 'browser-reported'
    lines.push(`  ${ts(e.created_at)}  ${describe(e)}`)
    lines.push(`      ${ip}  [${origin}]`)
  }
  lines.push('')

  if (truncated) {
    lines.push(`NOTE: the event list was capped and does not show every record.`)
    lines.push('')
  }

  lines.push('HOW THIS RECORD IS PRODUCED')
  lines.push('  Events marked [server-recorded] were written by our servers while')
  lines.push('  handling the request. They include the originating IP address as seen')
  lines.push('  by our infrastructure and cannot be produced by a web browser.')
  lines.push('  Events marked [browser-reported] were sent by the signed-in browser.')
  lines.push('  For these, the account was authenticated by us, the IP address was')
  lines.push('  recorded server-side, and access rights were verified against the')
  lines.push('  purchase record at the moment the event was written.')
  lines.push('  The log is append-only. Records cannot be edited after they are created.')

  return lines.join('\n')
}
