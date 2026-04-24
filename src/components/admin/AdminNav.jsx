import { Link, NavLink } from 'react-router-dom'
import ProfileDropdown from '../ui/ProfileDropdown'

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/webinars', label: 'Webinars' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/animations', label: 'Animations' },
  { to: '/admin/pose-studio', label: 'Pose Studio' },
]

export default function AdminNav({ user, onSignOut }) {
  return (
    <header
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
        padding: '0 1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
        >
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
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
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 500,
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              display: 'block',
            }}
          >
            Physics
          </span>
        </Link>

        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
          }}
        >
          Admin
        </span>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              style={({ isActive }) => ({
                fontSize: '0.8rem',
                fontFamily: '"DM Sans", sans-serif',
                textDecoration: 'none',
                color: isActive ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                borderBottom: isActive ? '1px solid var(--color-accent)' : '1px solid transparent',
                paddingBottom: '2px',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          to="/portal"
          style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', textDecoration: 'none' }}
        >
          Exit to Portal
        </Link>
        <ProfileDropdown user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}
