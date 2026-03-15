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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand + tagline */}
          <div>
            <p
              className="text-lg mb-2"
              style={{
                fontFamily: '"DM Serif Display", serif',
                color: 'var(--color-ink)',
              }}
            >
              Pilates Physics
            </p>
            <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Biomechanics-grounded Pilates education.
            </p>
          </div>

          {/* Column 2: Links */}
          <div>
            <p
              className="mb-3 text-sm font-medium"
              style={{ color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Navigation
            </p>
            <nav className="flex flex-col gap-2">
              <Link
                to="/about"
                style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                About
              </Link>
              <Link
                to="/course"
                style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Course
              </Link>
            </nav>
          </div>

          {/* Column 3: Social + copyright */}
          <div>
            <p
              className="mb-3 text-sm font-medium"
              style={{ color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Connect
            </p>
            <a
              href="#"
              style={{ color: 'var(--color-ink-muted)', textDecoration: 'none', fontSize: '0.9rem' }}
            >
              Instagram
            </a>
            <p
              className="mt-6"
              style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem' }}
            >
              &copy; 2025 Pilates Physics
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
