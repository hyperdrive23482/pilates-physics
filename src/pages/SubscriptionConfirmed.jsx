import { Link } from 'react-router-dom'

export default function SubscriptionConfirmed() {
  return (
    <section
      style={{
        maxWidth: '680px',
        margin: '0 auto',
        padding: '8rem 2rem 6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        alignItems: 'flex-start',
      }}
    >
      <p
        style={{
          fontSize: '0.7rem',
          fontWeight: '600',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          margin: 0,
        }}
      >
        Subscription confirmed
      </p>

      <h1
        style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          lineHeight: '1.15',
          color: 'var(--color-ink)',
          margin: 0,
        }}
      >
        You're in. Welcome to Pilates Physics.
      </h1>

      <p
        style={{
          fontSize: '1.05rem',
          lineHeight: '1.7',
          color: 'var(--color-ink-muted)',
          margin: 0,
        }}
      >
        Your email is confirmed and you'll be the first to hear about new webinars and the occasional note on the mechanics behind the equipment you teach on.
        No spam — just the good stuff.
      </p>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--color-accent)',
          color: '#1C1A17',
          textDecoration: 'none',
          fontSize: '0.9rem',
          fontWeight: '500',
          fontFamily: '"DM Sans", sans-serif',
        }}
      >
        Back to Home
      </Link>
    </section>
  )
}
