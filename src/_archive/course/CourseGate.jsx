import { Link } from 'react-router-dom'

export default function CourseGate() {
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

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link
            to="/signup"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: '"DM Sans", sans-serif',
              background: 'var(--color-accent)',
              color: '#1C1A17',
              border: 'none',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              fontFamily: '"DM Sans", sans-serif',
              background: 'transparent',
              color: 'var(--color-accent)',
              border: '1.5px solid var(--color-accent)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}
