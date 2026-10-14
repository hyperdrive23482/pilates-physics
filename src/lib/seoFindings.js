// Pure helpers for /admin/seo: grouping findings by fix and ranking them.
// Kept out of the components so node --test covers the ranking.

export const SEVERITY_ORDER = { error: 0, warn: 1, info: 2 }
export const SEVERITY_WEIGHT = { error: 9, warn: 3, info: 1 }
export const SEVERITY_LABEL = { error: 'Error', warn: 'Warning', info: 'Info' }

/** Site-level findings are stored with path '' in dismissals, null on findings. */
export const dismissalKey = (ruleId, path) => `${ruleId}\u0000${path ?? ''}`

/** Paths a finding touches: its own, or a site-level finding's evidence list. */
export function findingPaths(f) {
  if (f.path) return [f.path]
  return Array.isArray(f.evidence?.paths) ? f.evidence.paths.filter((p) => typeof p === 'string') : []
}

/**
 * Findings grouped by rule, ranked by severity × pages × (1 + 30-day visitors
 * to those pages), so a problem on the home page outranks the same problem on
 * the terms page. A group is dismissed only when every finding in it is.
 */
export function groupFindings(findings, dismissals = [], visitors = {}) {
  const dismissed = new Set(dismissals.map((d) => dismissalKey(d.rule_id, d.path)))
  const groups = new Map()
  for (const f of findings ?? []) {
    const g = groups.get(f.rule_id) ?? { rule_id: f.rule_id, severity: f.severity, findings: [], paths: new Set() }
    g.findings.push(f)
    if (SEVERITY_ORDER[f.severity] < SEVERITY_ORDER[g.severity]) g.severity = f.severity
    for (const p of findingPaths(f)) g.paths.add(p)
    groups.set(f.rule_id, g)
  }
  return [...groups.values()]
    .map((g) => {
      const paths = [...g.paths].sort()
      const traffic = paths.reduce((s, p) => s + (visitors[p] ?? 0), 0)
      return {
        rule_id: g.rule_id,
        severity: g.severity,
        findings: g.findings,
        paths,
        visitors: traffic,
        dismissed: g.findings.every((f) => dismissed.has(dismissalKey(f.rule_id, f.path))),
        score: SEVERITY_WEIGHT[g.severity] * Math.max(paths.length, 1) * (1 + traffic),
      }
    })
    .sort((a, b) => b.score - a.score || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.rule_id.localeCompare(b.rule_id))
}

/** "3 hours ago", "2 days ago", or a dash. */
export function timeAgo(iso, now = Date.now()) {
  if (!iso) return '—'
  const s = Math.round((now - new Date(iso).getTime()) / 1000)
  if (!Number.isFinite(s)) return '—'
  if (s < 60) return 'just now'
  const units = [
    [60 * 60 * 24, 'day'],
    [60 * 60, 'hour'],
    [60, 'minute'],
  ]
  for (const [size, name] of units) {
    if (s >= size) {
      const n = Math.floor(s / size)
      return `${n} ${name}${n === 1 ? '' : 's'} ago`
    }
  }
  return 'just now'
}

/** Seconds as "1m 05s", or a dash. */
export function formatDuration(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`
}
