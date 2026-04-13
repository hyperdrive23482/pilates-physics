import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--color-rule)',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand + tagline */}
          <div className="md:col-span-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: '500',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-ink)',
                borderBottom: '1px solid var(--color-accent)',
                paddingBottom: '2px',
                display: 'block',
              }}>
                Pilates
              </span>
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: '500',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                display: 'block',
              }}>
                Physics
              </span>
            </div>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Mechanics-grounded Pilates education.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <p
              className="mb-3 text-sm font-medium"
              style={{ color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              <Link to="/about" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                About Kaleen
              </Link>
              <Link to="/courses" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Webinar
              </Link>

<Link to="/contact" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Contact
              </Link>
            </nav>
          </div>

          {/* Column 3: Admin */}
          <div>
            <p
              className="mb-3 text-sm font-medium"
              style={{ color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Admin
            </p>
            <nav className="flex flex-col gap-2">
              <Link to="/terms" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Terms
              </Link>
              <Link to="/privacy" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Privacy
              </Link>
              <Link to="/help" style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                Help
              </Link>
            </nav>
            </div>
        </div>
        <p
          className="mt-10 text-center"
          style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem' }}
        >
          &copy; 2026 Pilates Physics
        </p>
      </div>
    </footer>
  )
}
