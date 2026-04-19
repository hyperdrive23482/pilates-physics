import { useEffect, useState } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'

function formatCents(cents) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

export default function AdminAnalytics() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    request('/api/admin/analytics-summary')
      .then(setData)
      .catch((e) => setError(e.message))
  }, [request])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          Analytics
        </h1>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {data && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '3rem',
              }}
            >
              <StatCard label="Total revenue" value={formatCents(data.totals.total_revenue_cents)} />
              <StatCard label="Total enrollments" value={data.totals.total_enrollments} />
              <StatCard label="Total users" value={data.totals.total_users} />
              <StatCard label="Questions submitted" value={data.totals.total_questions} />
            </div>

            <section>
              <h2
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--color-ink-muted)',
                  marginBottom: '1rem',
                }}
              >
                Per webinar
              </h2>
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                      <Th>Title</Th>
                      <Th>Status</Th>
                      <Th align="right">Enrollments</Th>
                      <Th align="right">Paid</Th>
                      <Th align="right">Revenue</Th>
                      <Th align="right">Questions</Th>
                      <Th align="right">Unanswered</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.per_webinar.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                        <Td>{w.title}</Td>
                        <Td mono>{w.status}</Td>
                        <Td align="right" mono>{w.enrollments}</Td>
                        <Td align="right" mono>{w.paid_enrollments}</Td>
                        <Td align="right" mono>{formatCents(w.revenue_cents)}</Td>
                        <Td align="right" mono>{w.questions}</Td>
                        <Td align="right" mono>{w.unanswered_questions}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.75rem 1rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
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
        padding: '0.75rem 1rem',
        textAlign: align,
        color: 'var(--color-ink)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : undefined,
        fontSize: mono ? '0.8rem' : undefined,
      }}
    >
      {children}
    </td>
  )
}
