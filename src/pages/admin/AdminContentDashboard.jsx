import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, Calendar, Brain, ArrowRight, FileText } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'

function formatPercent(n) {
  if (n === null || n === undefined) return '—'
  return `${(Number(n) * (Number(n) > 1 ? 1 : 100)).toFixed(1)}%`
}

// Whole-day delta from today, anchored to local midnight so a workshop
// scheduled for 10pm tonight reads as "today" (not "in 0 days").
function relativeDays(iso) {
  if (!iso) return null
  const target = new Date(iso)
  const now = new Date()
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((startOfTarget - startOfToday) / 86400000)
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff === -1) return 'yesterday'
  if (diff > 1) return `in ${diff} days`
  return `${Math.abs(diff)} days ago`
}

export default function AdminContentDashboard() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    request('/api/admin/content/dashboard-stats')
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [request])

  const counts = stats?.pipeline_counts ?? {}
  const ideas = stats?.idea_counts ?? {}
  const brain = stats?.brain_summary ?? {}
  const upcoming = stats?.upcoming ?? []
  const recent = stats?.recent_broadcasts ?? []
  const upcomingWorkshops = stats?.upcoming_workshops ?? []
  const pastWorkshops = stats?.past_workshops ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '2rem' }}>
          <div>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginBottom: '0.5rem',
              }}
            >
              Content
            </p>
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              Pipeline overview
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <SecondaryLink to="/admin/content/brain" icon={<Brain size={14} />} label="Brain" />
            <SecondaryLink to="/admin/content/blog-posts" icon={<FileText size={14} />} label="Blog posts" />
            <SecondaryLink to="/admin/content/calendar" icon={<Calendar size={14} />} label="Calendar" />
            <PrimaryLink to="/admin/content/ideas" icon={<Lightbulb size={14} />} label="Ideas" />
          </div>
        </div>

        {error && <p style={{ color: '#ff7d7d', fontSize: '0.85rem' }}>{error}</p>}
        {!stats && !error && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {stats && (
          <>
            <SectionLabel>Pipeline</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}
            >
              <StatCard label="Open ideas" value={ideas.open ?? 0} />
              <StatCard label="Drafting" value={counts.drafting ?? 0} />
              <StatCard label="In review" value={counts.in_review ?? 0} />
              <StatCard label="Scheduled" value={counts.scheduled ?? 0} />
              <StatCard label="Published" value={counts.published ?? 0} />
              <StatCard
                label="Brain"
                value={brain.active_entries ?? 0}
                sublabel={`${(brain.active_token_estimate ?? 0).toLocaleString()} active tokens`}
              />
            </div>

            <SectionLabel>Workshops</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '2.5rem',
              }}
              className="pp-grid-2"
            >
              <WorkshopColumn
                heading="Upcoming"
                rows={upcomingWorkshops}
                emptyText="None scheduled."
              />
              <WorkshopColumn
                heading="Recent past"
                rows={pastWorkshops}
                emptyText="None yet."
              />
            </div>

            <SectionLabel>Upcoming scheduled</SectionLabel>
            {upcoming.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
                Nothing scheduled.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem' }}>
                {upcoming.map((p) => (
                  <Link
                    key={p.id}
                    to={`/admin/content/pieces/${p.id}`}
                    style={listRowStyle}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{p.title || 'Untitled'}</span>
                    <span style={listMetaStyle}>
                      {p.scheduled_for ? new Date(p.scheduled_for).toLocaleString() : '—'}
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                ))}
              </div>
            )}

            <SectionLabel>Recent broadcast performance</SectionLabel>
            {recent.length === 0 ? (
              <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>
                No broadcast data available from Kit yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recent.map((b) => (
                  <div key={b.id} style={listRowStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.95rem' }}>{b.subject || '(no subject)'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                        {b.send_at ? new Date(b.send_at).toLocaleString() : 'Draft'}
                      </span>
                    </div>
                    <span style={listMetaStyle}>
                      {b.stats ? `${formatPercent(b.stats.open_rate)} opens · ${formatPercent(b.stats.click_rate)} clicks` : 'Stats pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function WorkshopColumn({ heading, rows, emptyText }) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {heading}
      </div>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.85rem', margin: 0 }}>{emptyText}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rows.map((w) => (
            <Link
              key={w.id}
              to={`/admin/webinars/${w.slug}/edit`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: '0.75rem',
                padding: '0.5rem 0',
                textDecoration: 'none',
                color: 'var(--color-ink)',
                borderBottom: '1px solid var(--color-rule)',
              }}
            >
              <span style={{ fontSize: '0.9rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {w.title}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
              >
                {relativeDays(w.scheduled_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
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

function PrimaryLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.7rem 1.1rem',
        background: 'var(--color-accent)',
        color: '#1C1A17',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

function SecondaryLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.7rem 1.1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        color: 'var(--color-ink)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 500,
      }}
    >
      {icon}
      {label}
    </Link>
  )
}

const listRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.9rem 1rem',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-rule)',
  textDecoration: 'none',
  color: 'var(--color-ink)',
}

const listMetaStyle = {
  fontSize: '0.8rem',
  color: 'var(--color-ink-muted)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
}
