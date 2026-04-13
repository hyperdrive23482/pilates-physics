import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-rule)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
        >
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: '500',
            fontSize: '0.75rem',
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
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            display: 'block',
          }}>
            Physics
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          <Link
            to="/about"
            style={{
              color: 'var(--color-ink-muted)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
            }}
          >
            About
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label="Toggle menu"
          style={{ color: 'var(--color-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-bg)',
            borderTop: '1px solid var(--color-rule)',
          }}
        >
          <nav className="flex flex-col px-6 py-4 gap-4">
            <Link
              to="/about"
              onClick={() => setMobileOpen(false)}
              style={{
                color: 'var(--color-ink-muted)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.5rem 0',
              }}
            >
              About
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
