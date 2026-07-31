import { useState, useRef, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import ProfileDropdown from '../ui/ProfileDropdown'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/content', label: 'Content' },
  { to: '/admin/instagram', label: 'Instagram' },
  { to: '/admin/announcements', label: 'Announcements' },
  { to: '/admin/workshops', label: 'Workshops' },
  { to: '/admin/tools', label: 'Tools' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/workshop-feedback', label: 'Feedback' },
  { to: '/admin/animations', label: 'Animations' },
  { to: '/admin/pose-studio', label: 'Pose Studio' },
]

export default function AdminNav({ user, onSignOut }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    if (!drawerOpen) return
    function handleClick(e) {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [drawerOpen])

  return (
    <header
      className="pp-nav-compact"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: '64px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid var(--color-rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 0 }}>
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              fontSize: '13px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              lineHeight: '1.05',
              color: 'var(--color-ink)',
              borderBottom: '1px solid var(--color-accent)',
              paddingBottom: '2px',
              display: 'block',
            }}
          >
            Pilates
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              fontSize: '13px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              lineHeight: '1.05',
              color: 'var(--color-accent)',
              display: 'block',
            }}
          >
            Physics
          </span>
        </Link>

        <span className="pp-eyebrow" style={{ flexShrink: 0 }}>
          Admin
        </span>

        <nav
          className="pp-admin-nav-links"
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}
        >
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          to="/portal"
          className="pp-admin-nav-exit nav-link"
        >
          Exit to Portal
        </Link>
        <ProfileDropdown user={user} onSignOut={onSignOut} />
        <button
          ref={toggleRef}
          type="button"
          className="pp-admin-nav-toggle"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {drawerOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {drawerOpen && (
        <div ref={drawerRef} className="pp-admin-nav-drawer">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/portal"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'block',
              padding: '0.85rem 1.25rem',
              fontSize: '0.9rem',
              fontFamily: 'var(--font-serif)',
              color: 'var(--color-ink-muted)',
              textDecoration: 'none',
              borderTop: '1px solid var(--color-rule)',
              marginTop: '0.5rem',
              paddingTop: '1rem',
            }}
          >
            Exit to Portal
          </Link>
        </div>
      )}
    </header>
  )
}
