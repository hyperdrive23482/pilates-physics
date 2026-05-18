import { Link } from 'react-router-dom'
import ProfileDropdown from '../ui/ProfileDropdown'

export default function PortalNav({ user, onSignOut }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
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

        <span className="pp-section-label">
          Portal
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ProfileDropdown user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}
