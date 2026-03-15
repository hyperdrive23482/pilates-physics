import { useState } from 'react'

// Full ConvertKit integration arrives in Phase 5.
// For now: captures email, sets pp_enrolled, calls onEnroll.
export default function CourseGate({ onEnroll }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')

    try {
      await new Promise((r) => setTimeout(r, 600))
      localStorage.setItem('pp_enrolled', 'true')
      setStatus('success')
      if (onEnroll) onEnroll()
    } catch {
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Eyebrow */}
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: '1.25rem',
          }}
        >
          Free Course — Pilates Physics
        </p>

        <h1
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15',
            color: 'var(--color-ink)',
            margin: '0 0 1.25rem',
          }}
        >
          The mechanics behind the method
        </h1>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: 'var(--color-ink-muted)',
            margin: '0 0 2.5rem',
          }}
        >
          Four modules. Spring physics, force environments, and a transferable framework
          for reasoning about any exercise, on any equipment, with any client. Free to
          start, no prerequisites required.
        </p>

        {status === 'success' ? (
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: '1.25rem',
              color: 'var(--color-accent)',
            }}
          >
            You're in. Loading your course…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  fontFamily: '"DM Sans", sans-serif',
                  border: '1px solid var(--color-rule)',
                  borderRight: 'none',
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  outline: 'none',
                  borderRadius: '0',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  fontFamily: '"DM Sans", sans-serif',
                  background: 'var(--color-accent)',
                  color: '#fff',
                  border: 'none',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  borderRadius: '0',
                  whiteSpace: 'nowrap',
                }}
              >
                {status === 'loading' ? 'Starting…' : 'Start the Free Course'}
              </button>
            </div>
            {status === 'error' && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
                Something went wrong. Try again.
              </p>
            )}
            <p
              style={{
                marginTop: '0.75rem',
                fontSize: '0.78rem',
                color: 'var(--color-ink-muted)',
              }}
            >
              No spam. Unsubscribe anytime.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
