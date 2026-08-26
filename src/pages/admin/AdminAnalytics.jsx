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
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
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

            {data.engagement && <Engagement engagement={data.engagement} />}

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
                Per workshop
              </h2>
              <div className="pp-table-wrap" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
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
                    {data.per_workshop.map((w) => (
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

function Engagement({ engagement }) {
  const { buyers, buyers_signed_in: signedIn, buyers_never_signed_in: never } = engagement
  const pct = buyers ? Math.round((signedIn / buyers) * 100) : 0

  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>Engagement</SectionHeading>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Counted from auth.users.last_sign_in_at rather than the activity
            log, which only starts in Aug 2026 and would report nearly every
            existing customer as never having signed in. */}
        <StatCard label="Buyers who signed in" value={`${pct}%`} />
        <StatCard label="Buyers never signed in" value={never} />
        <StatCard label="Active last 30 days" value={engagement.active_users_30d} />
        <StatCard label="Recorded events" value={engagement.recorded_events} />
      </div>

      {engagement.truncated && (
        <p style={{ fontSize: '0.75rem', color: '#e0a458', margin: '0 0 1rem' }}>
          Event read hit its cap, so the breakdowns below are partial.
        </p>
      )}

      <EngagementTable
        title="Content opened"
        rows={engagement.content}
        empty="No content opens recorded yet."
      />
      <EngagementTable
        title="Tools used"
        rows={engagement.tools}
        empty="No tool opens recorded yet."
      />
    </section>
  )
}

function EngagementTable({ title, rows, empty }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <SectionHeading>{title}</SectionHeading>
      {rows?.length ? (
        <div
          className="pp-table-wrap"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <Th>Item</Th>
                <Th align="right">People</Th>
                <Th align="right">Opens</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <Td>{r.label}</Td>
                  {/* Distinct people first: one person replaying a recording
                      ten times is one person who wanted it. */}
                  <Td align="right" mono>{r.distinct_users}</Td>
                  <Td align="right" mono>{r.opens}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>{empty}</p>
      )}
    </div>
  )
}

function SectionHeading({ children }) {
  return (
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
      {children}
    </h2>
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
