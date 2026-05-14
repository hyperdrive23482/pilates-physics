import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const WORKSHOP_TITLE = 'Pilates Physics 101'
const WORKSHOP_DATE = '2026-05-20'
const WORKSHOP_SLUG = 'PP-101-May-2026'
const SURVEY_CUTOFF = new Date('2026-06-01T00:00:00')

/**
 * Login-time prompt asking attendees of Pilates Physics 101 to fill out the
 * post-workshop survey. Shown only when the user is entitled to PP-101, the
 * cutoff hasn't passed, and they haven't already submitted.
 */
export default function Pp101FeedbackBanner({ user, webinars }) {
  const [submissionState, setSubmissionState] = useState('checking') // 'checking' | 'pending' | 'done'

  const entitled = webinars?.some((w) => w.slug === WORKSHOP_SLUG) ?? false
  const beforeCutoff = new Date() < SURVEY_CUTOFF

  useEffect(() => {
    if (!user?.id || !entitled || !beforeCutoff) {
      setSubmissionState('done')
      return
    }
    let cancelled = false
    supabase
      .from('workshop_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('workshop_title', WORKSHOP_TITLE)
      .eq('workshop_date', WORKSHOP_DATE)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setSubmissionState(data ? 'done' : 'pending')
      })
    return () => {
      cancelled = true
    }
  }, [user?.id, entitled, beforeCutoff])

  if (!entitled || !beforeCutoff || submissionState !== 'pending') return null

  return (
    <div
      style={{
        marginBottom: '2rem',
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
          Your feedback on {WORKSHOP_TITLE} would mean a lot — about 5 minutes, helps shape the
          next one.
        </p>
      </div>
      <Link
        to="/portal/survey-101"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--color-accent)',
          color: '#1C1A17',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: '500',
          fontFamily: '"DM Sans", sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        Fill out survey <ArrowRight size={16} />
      </Link>
    </div>
  )
}
