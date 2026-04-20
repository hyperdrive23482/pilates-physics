import { Link } from 'react-router-dom'

export default function EarlyBirdBanner() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        height: '2.5rem',
        background: 'var(--color-surface-raised)',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          height: '100%',
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.78rem',
          color: 'var(--color-ink)',
        }}
      >
        <span style={{ lineHeight: 1.2 }}>
          EARLY BIRD BONUS! Register before May 1st for a free bonus
          <span className="hidden sm:inline"> interactive</span> spring force calculator.
        </span>
        <Link
          to="/workshops#register"
          style={{
            color: 'var(--color-accent)',
            textDecoration: 'underline',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          Register now →
        </Link>
      </div>
    </div>
  )
}
