import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

const logoTextStyle = {
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '13px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  lineHeight: '1.05',
  display: 'block',
}

const ghostButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '10px 18px 9px',
  fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  fontWeight: 400,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-ink)',
  background: 'transparent',
  border: '1px solid var(--color-rule)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'border-color 0.15s ease',
}

const filledButtonStyle = {
  ...ghostButtonStyle,
  color: 'var(--color-accent-ink)',
  background: 'var(--color-accent)',
  border: '1px solid var(--color-accent)',
  transition: 'background 0.15s ease, border-color 0.15s ease',
}

export default function Navbar({ hasAnnouncement = true }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={`fixed left-0 right-0 z-50 ${hasAnnouncement ? 'top-10' : 'top-0'}`}
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
          <span
            style={{
              ...logoTextStyle,
              color: 'var(--color-ink)',
              fontWeight: 600,
              borderBottom: '1px solid var(--color-accent)',
              paddingBottom: '2px',
            }}
          >
            Pilates
          </span>
          <span style={{ ...logoTextStyle, color: 'var(--color-accent)', fontWeight: 500 }}>
            Physics
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center" style={{ gap: '28px' }}>
          <NavLink to="/" className="nav-link" end>Home</NavLink>
          <NavLink to="/education" className="nav-link">Education</NavLink>
          <NavLink to="/blog" className="nav-link">Blog</NavLink>
          <NavLink to="/about" className="nav-link">About Kaleen</NavLink>
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center" style={{ gap: '12px' }}>
          <Link
            to="/login"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-ink)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-rule)' }}
          >
            Login
          </Link>
          <Link
            to="/spring-calculator"
            style={filledButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-warm)'; e.currentTarget.style.borderColor = 'var(--color-accent-warm)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.borderColor = 'var(--color-accent)' }}
          >
            Free spring calculator
          </Link>
        </div>

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
          <nav className="flex flex-col px-6 py-4 gap-2">
            <NavLink to="/" className="nav-link" end onClick={() => setMobileOpen(false)} style={{ padding: '0.5rem 0' }}>Home</NavLink>
            <NavLink to="/education" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '0.5rem 0' }}>Education</NavLink>
            <NavLink to="/blog" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '0.5rem 0' }}>Blog</NavLink>
            <NavLink to="/about" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '0.5rem 0' }}>About Kaleen</NavLink>
            <NavLink to="/login" className="nav-link" onClick={() => setMobileOpen(false)} style={{ padding: '0.5rem 0' }}>Login</NavLink>
            <Link
              to="/spring-calculator"
              onClick={() => setMobileOpen(false)}
              style={{ ...filledButtonStyle, marginTop: '8px', justifyContent: 'center' }}
            >
              Free spring calculator
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
