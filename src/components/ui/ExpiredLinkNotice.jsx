import { Link } from 'react-router-dom'

/**
 * Shown when an auth link can't establish a session: expired, already used, or
 * opened in a context that dropped the session (common with in-app email
 * browsers). Routes the user to request a fresh link.
 */
export default function ExpiredLinkNotice() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <p className="pp-eyebrow" style={{ marginBottom: '1.25rem' }}>
          Link Expired
        </p>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            lineHeight: '1.15',
            color: 'var(--color-ink)',
            margin: '0 0 1.25rem',
          }}
        >
          This link didn't work
        </h1>

        <p
          style={{
            fontSize: '1rem',
            lineHeight: '1.75',
            color: 'var(--color-ink-muted)',
            margin: '0 0 2rem',
          }}
        >
          Sign-in links are single-use and expire about an hour after they're
          sent. Request a fresh one below, then open it right away in your normal
          browser rather than inside an email app.
        </p>

        <Link
          to="/forgot-password"
          style={{
            display: 'block',
            width: '100%',
            padding: '0.85rem 1.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            border: 'none',
            textDecoration: 'none',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          Send me a new link
        </Link>

        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
          }}
        >
          Already set your password?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
