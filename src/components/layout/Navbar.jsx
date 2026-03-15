import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'About', href: '/about' },
  { label: 'Course', href: '/course' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const isActive = (href) => location.pathname === href

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
          className="text-xl"
          style={{
            fontFamily: '"DM Serif Display", serif',
            color: 'var(--color-ink)',
            textDecoration: 'none',
          }}
        >
          Pilates Physics
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              style={{
                color: isActive(link.href)
                  ? 'var(--color-accent)'
                  : 'var(--color-ink)',
                fontWeight: isActive(link.href) ? '500' : '400',
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/course"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: '#fff',
              padding: '0.5rem 1.25rem',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: '500',
              borderRadius: 0,
              display: 'inline-block',
            }}
          >
            Start Free Course
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  color: isActive(link.href)
                    ? 'var(--color-accent)'
                    : 'var(--color-ink)',
                  fontWeight: isActive(link.href) ? '500' : '400',
                  textDecoration: 'none',
                  fontSize: '1rem',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/course"
              onClick={() => setMobileOpen(false)}
              style={{
                backgroundColor: 'var(--color-accent)',
                color: '#fff',
                padding: '0.625rem 1.25rem',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                textAlign: 'center',
                display: 'block',
              }}
            >
              Start Free Course
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
