import { useState } from 'react'
import { BAD, Muted, Note, Section } from '../analytics/primitives'
import { formatCount } from '../analytics/shared'
import { dismissalKey, groupFindings, timeAgo } from '../../../lib/seoFindings'
import { Pill, SeverityBadge, SmallButton } from './parts'

/**
 * Recommendations tab: findings grouped by fix rather than by page, ranked by
 * severity × pages × 30-day visitors to those pages. Ported from remo.
 *
 * "Ignore" stores a dismissal by (rule, path) so it outlives the next run.
 * "Done" re-runs the audit, because the only proof a fix landed is the
 * finding not coming back.
 */

const box = { border: '1px solid var(--color-rule)', borderRadius: 6, padding: '0.9rem 1rem' }
const h3 = { margin: '0 0 0.75rem', fontSize: '0.95rem', fontFamily: 'var(--font-serif)', fontWeight: 500, color: 'var(--color-ink)' }

function NarrativeView({ record }) {
  const n = record.output
  return (
    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.25rem' }}>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-ink)', lineHeight: 1.6 }}>{n.summary}</p>

      <div>
        <h3 style={h3}>Do these first</h3>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {n.top_changes.map((c, i) => (
            <div key={i} style={box}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <p style={{ margin: 0, color: 'var(--color-ink)', fontWeight: 600, fontSize: '0.88rem' }}>
                  {i + 1}. {c.title}
                </p>
                <Pill>impact {c.impact}</Pill>
                <Pill>effort {c.effort}</Pill>
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>
                <b style={{ color: 'var(--color-ink)' }}>Why:</b> {c.why}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--color-ink)' }}>
                <b>How:</b> {c.how}
              </p>
              {c.source_files?.length ? (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-mono)' }}>
                  {c.source_files.join(', ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {n.rewrites.length ? (
        <div>
          <h3 style={h3}>Titles and descriptions</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {n.rewrites.map((r) => (
              <div key={r.path} style={{ ...box, fontSize: '0.82rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink)' }}>{r.path}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.3rem 0.75rem' }}>
                  <span style={{ color: 'var(--color-ink-dim)' }}>Title now</span>
                  <span style={{ color: 'var(--color-ink-muted)' }}>{r.current_title ?? '(none)'}</span>
                  <span style={{ color: 'var(--color-ink-dim)' }}>Proposed</span>
                  <span style={{ color: 'var(--color-ink)' }}>
                    {r.proposed_title} <span style={{ color: 'var(--color-ink-dim)' }}>({r.proposed_title.length})</span>
                  </span>
                  <span style={{ color: 'var(--color-ink-dim)' }}>Desc. now</span>
                  <span style={{ color: 'var(--color-ink-muted)' }}>{r.current_description ?? '(none)'}</span>
                  <span style={{ color: 'var(--color-ink-dim)' }}>Proposed</span>
                  <span style={{ color: 'var(--color-ink)' }}>
                    {r.proposed_description} <span style={{ color: 'var(--color-ink-dim)' }}>({r.proposed_description.length})</span>
                  </span>
                </div>
                <Note>{r.reason}</Note>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {n.content_ideas.length ? (
        <div>
          <h3 style={h3}>Content worth writing</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {n.content_ideas.map((c, i) => (
              <div key={i} style={{ ...box, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: 'var(--color-ink)', fontWeight: 600 }}>{c.working_title}</p>
                  <Pill>{c.format}</Pill>
                </div>
                <p style={{ margin: '0.4rem 0 0', color: 'var(--color-ink-muted)' }}>
                  Aimed at: <span style={{ color: 'var(--color-ink)' }}>&ldquo;{c.target_query}&rdquo;</span>
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'var(--color-ink-muted)' }}>{c.why}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {n.caveats.length ? (
        <div>
          <h3 style={h3}>What this cannot tell you</h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: 'var(--color-ink-muted)', display: 'grid', gap: '0.25rem' }}>
            {n.caveats.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Note style={{ borderTop: '1px solid var(--color-rule)', paddingTop: '0.75rem' }}>
        Written {timeAgo(record.generated_at)} by {record.model} from {record.input_counts.findings} open findings, {record.input_counts.pages}{' '}
        pages and {record.input_counts.queries} search queries · ${Number(record.cost_usd).toFixed(3)}.
      </Note>
    </div>
  )
}

function GroupCard({ group, dismissals, visitors, busy, onRunAudit, onDismiss, onUndismiss }) {
  const [ignoring, setIgnoring] = useState(false)
  const [reason, setReason] = useState('')
  const first = group.findings[0]
  const siteLevel = group.findings.length === 1 && first.path === null
  const dismissedKeys = new Set(dismissals.map((d) => dismissalKey(d.rule_id, d.path)))
  const reasonFor = (f) => dismissals.find((d) => dismissalKey(d.rule_id, d.path) === dismissalKey(f.rule_id, f.path))?.reason

  const ignoreAll = async () => {
    const targets = group.findings.filter((f) => !dismissedKeys.has(dismissalKey(f.rule_id, f.path)))
    await onDismiss(targets.map((f) => ({ rule_id: f.rule_id, path: f.path ?? '', reason: reason.trim() || null })))
    setIgnoring(false)
    setReason('')
  }
  const restoreAll = () =>
    onUndismiss(
      group.findings.filter((f) => dismissedKeys.has(dismissalKey(f.rule_id, f.path))).map((f) => ({ rule_id: f.rule_id, path: f.path ?? '' })),
    )

  const heading = siteLevel
    ? first.title
    : `${group.findings.length} page${group.findings.length === 1 ? '' : 's'}: ${first.title.replace(/^\S+ /, '')}`

  return (
    <div className="pp-card" style={{ opacity: group.dismissed ? 0.6 : 1, padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', minWidth: 0, flex: '1 1 320px' }}>
          <SeverityBadge severity={group.severity} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: 'var(--color-ink)', fontSize: '0.9rem' }}>{heading}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--color-ink-dim)', fontFamily: 'var(--font-mono)' }}>
              {group.rule_id} · {formatCount(group.visitors)} visitors in 30 days on these pages
              {first.mode !== 'raw' ? ` · ${first.mode}` : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          {group.dismissed ? (
            <SmallButton onClick={restoreAll}>Restore</SmallButton>
          ) : (
            <>
              <SmallButton onClick={() => setIgnoring((v) => !v)}>Ignore</SmallButton>
              <SmallButton onClick={onRunAudit} disabled={Boolean(busy)} title="Re-runs the audit. If the finding is gone, it is done.">
                Done
              </SmallButton>
            </>
          )}
        </div>
      </div>

      {ignoring ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why (optional, kept with the dismissal)"
            style={{
              flex: '1 1 260px',
              maxWidth: 420,
              padding: '0.45rem 0.7rem',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-rule)',
              color: 'var(--color-ink)',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          />
          <SmallButton primary onClick={ignoreAll}>
            Ignore{group.findings.length > 1 ? ' all' : ''}
          </SmallButton>
          <SmallButton onClick={() => setIgnoring(false)}>Cancel</SmallButton>
        </div>
      ) : null}

      <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--color-ink-muted)' }}>{first.detail}</p>
      <p style={{ margin: '0.4rem 0 0', fontSize: '0.82rem', color: 'var(--color-ink)' }}>
        <b>Fix:</b> {first.fix}
      </p>
      {first.source_files?.length ? (
        <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--color-ink-dim)' }}>
          Where: <span style={{ fontFamily: 'var(--font-mono)' }}>{first.source_files.join(', ')}</span>
        </p>
      ) : null}
      {group.paths.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
          {group.paths.map((p) => {
            const f = group.findings.find((x) => x.path === p)
            const dismissed = f ? dismissedKeys.has(dismissalKey(f.rule_id, f.path)) : false
            return (
              <Pill key={p} struck={dismissed} title={f && dismissed ? reasonFor(f) ?? 'ignored' : undefined}>
                {p}
                {typeof visitors[p] === 'number' ? ` · ${visitors[p]}` : ''}
              </Pill>
            )
          })}
        </div>
      ) : null}
      {group.dismissed && siteLevel ? <Note>Ignored{reasonFor(first) ? `: ${reasonFor(first)}` : ''}.</Note> : null}
    </div>
  )
}

export default function RecommendationsPanel({ findings, overview, busy, onRunAudit, onRecommend, onDismiss, onUndismiss }) {
  if (!findings?.run) {
    return <Muted>No audit has run yet. Run one from the Audit tab and the recommendations appear here.</Muted>
  }
  const groups = groupFindings(findings.findings, findings.dismissals, findings.visitors)
  const open = groups.filter((g) => !g.dismissed)
  const ignored = groups.filter((g) => g.dismissed)
  const common = { dismissals: findings.dismissals, visitors: findings.visitors, busy, onRunAudit, onDismiss, onUndismiss }
  const canWrite = overview?.config?.anthropic !== false

  return (
    <div>
      <div className="pp-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 380px' }}>
            <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1rem', color: 'var(--color-ink)' }}>Written recommendations</p>
            <Muted style={{ marginTop: '0.3rem' }}>
              Claude reads the open findings, page traffic and search queries, and writes the three changes with the most upside, title and
              description rewrites, and content ideas. About twenty cents a run; the last answer stays here until you ask again.
            </Muted>
          </div>
          <SmallButton primary onClick={onRecommend} disabled={Boolean(busy) || !canWrite} title={canWrite ? undefined : 'ANTHROPIC_API_KEY is not set'}>
            {busy === 'recommend' ? 'Writing… (a minute or two)' : findings.run.narrative ? 'Write again' : 'Write recommendations'}
          </SmallButton>
        </div>
        {findings.run.narrative ? <NarrativeView record={findings.run.narrative} /> : null}
      </div>

      <Section
        title="Open findings"
        note={
          findings.posthog_error
            ? `Visitor counts unavailable (${findings.posthog_error}), so the ranking is by severity and page count only.`
            : 'Ranked by severity × pages × 30-day visitors to those pages'
        }
      >
        {open.length === 0 ? (
          <Muted>Nothing open. Every finding from the last run is either fixed or ignored.</Muted>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {open.map((g) => (
              <GroupCard key={g.rule_id} group={g} {...common} />
            ))}
          </div>
        )}
      </Section>

      {ignored.length ? (
        <Section title="Ignored">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {ignored.map((g) => (
              <GroupCard key={g.rule_id} group={g} {...common} />
            ))}
          </div>
        </Section>
      ) : null}
      {findings.error ? <p style={{ color: BAD }}>{findings.error}</p> : null}
    </div>
  )
}
