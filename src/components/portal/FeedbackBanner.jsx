import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

/**
 * Iterates the user's entitled workshops and renders one banner per
 * workshop whose survey is currently open and not yet submitted by
 * this user. Stacks vertically if multiple surveys are eligible.
 */
export default function FeedbackBanner({ user, workshops }) {
  const eligible = (workshops ?? []).filter((w) => {
    const config = w.survey_config
    if (!config?.enabled) return false
    const now = Date.now()
    const opensAt = config.opens_at ? Date.parse(config.opens_at) : null
    const closesAt = config.closes_at ? Date.parse(config.closes_at) : null
    if (opensAt != null && now < opensAt) return false
    if (closesAt != null && now >= closesAt) return false
    return true
  })

  const [submittedIds, setSubmittedIds] = useState(null)

  useEffect(() => {
    if (!user?.id || eligible.length === 0) {
      setSubmittedIds(new Set())
      return
    }
    let cancelled = false
    const ids = eligible.map((w) => w.id)
    supabase
      .from('workshop_feedback')
      .select('webinar_id')
      .eq('user_id', user.id)
      .in('webinar_id', ids)
      .then(({ data }) => {
        if (cancelled) return
        setSubmittedIds(new Set((data ?? []).map((r) => r.webinar_id)))
      })
    return () => {
      cancelled = true
    }
    // eligible identities change every render; key off ids string instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, eligible.map((w) => w.id).join(',')])

  if (submittedIds == null) return null

  const toPrompt = eligible.filter((w) => !submittedIds.has(w.id))
  if (toPrompt.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
      {toPrompt.map((w) => (
        <SingleBanner key={w.id} workshop={w} />
      ))}
    </div>
  )
}

function SingleBanner({ workshop }) {
  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ flex: '1 1 320px' }}>
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            margin: '0 0 0.4rem',
          }}
        >
          Quick favor
        </p>
        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--color-ink)',
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          Your feedback on {workshop.title} would mean a lot. About 5 minutes, helps shape the next one.
        </p>
      </div>
      <Link
        to={`/portal/survey/${workshop.slug}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: '500',
          fontFamily: 'var(--font-serif)',
          whiteSpace: 'nowrap',
        }}
      >
        Fill out survey <ArrowRight size={16} />
      </Link>
    </div>
  )
}
