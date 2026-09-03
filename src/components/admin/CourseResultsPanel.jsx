import { useState, useEffect } from 'react'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'

// Who has passed, and when. This is the record to reach for if NPCP ever asks
// how a CEC was earned, which is why the pass date is shown to the day and
// the attempt count is visible next to it.

export default function CourseResultsPanel({ workshop }) {
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workshop?.id) return
    let cancelled = false
    setLoading(true)
    request(`/api/admin/course-results?webinar_id=${workshop.id}`)
      .then((d) => {
        if (!cancelled) {
          setData(d)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [request, workshop?.id])

  if (loading) return <Muted>Loading results…</Muted>
  if (error) return <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>

  const rows = data?.results ?? []
  const moduleCount = data?.module_count ?? 0
  const passed = rows.filter((r) => r.passed).length
  const started = rows.filter((r) => r.modules_done > 0 || r.attempts > 0).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          border: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
          padding: '0.8rem 1rem',
          fontSize: '0.85rem',
        }}
      >
        <strong>{rows.length}</strong>
        <span style={{ color: 'var(--color-ink-muted)' }}> with access · </span>
        <strong>{started}</strong>
        <span style={{ color: 'var(--color-ink-muted)' }}> started · </span>
        <strong>{passed}</strong>
        <span style={{ color: 'var(--color-ink-muted)' }}>
          {' '}
          passed and eligible for the certificate
        </span>
      </div>

      {rows.length === 0 ? (
        <Muted>Nobody has access to this course yet.</Muted>
      ) : (
        <div
          className="pp-table-wrap"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th align="right">Modules</Th>
                <Th align="right">Attempts</Th>
                <Th align="right">Best</Th>
                <Th>Passed</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Td>{[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}</Td>
                  <Td mono>{r.email ?? '—'}</Td>
                  <Td align="right" mono>
                    {r.modules_done}
                    {moduleCount ? ` / ${moduleCount}` : ''}
                  </Td>
                  <Td align="right" mono>
                    {r.attempts || '—'}
                  </Td>
                  <Td align="right" mono>
                    {r.best_score == null ? '—' : `${r.best_score}/${r.total}`}
                  </Td>
                  <Td>
                    {r.passed ? (
                      <span style={{ color: '#4a9d5f' }}>
                        {r.first_passed_at
                          ? new Date(r.first_passed_at).toLocaleDateString()
                          : 'yes'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-ink-muted)' }}>—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', margin: 0 }}>
        Module counts show how far someone has clicked, not how much they watched.
        The passed date is what the certificate prints.
      </p>
    </div>
  )
}

function Muted({ children }) {
  return <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>{children}</p>
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.6rem 0.8rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left', mono }) {
  return (
    <td
      style={{
        textAlign: align,
        padding: '0.6rem 0.8rem',
        color: 'var(--color-ink)',
        fontFamily: mono ? 'var(--font-mono, monospace)' : 'inherit',
        fontSize: mono ? '0.8rem' : '0.85rem',
      }}
    >
      {children}
    </td>
  )
}
