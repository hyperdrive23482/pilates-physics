import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, HelpCircle, CreditCard, LogOut } from 'lucide-react'

export default function ProfileDropdown({ user, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const firstName = user?.user_metadata?.first_name || ''
  const lastName = user?.user_metadata?.last_name || ''
  const initials = (firstName[0] || '') + (lastName[0] || '') || '?'

  const menuItems = [
    { label: 'Your Profile', icon: User, to: '/profile' },
    { label: 'Help', icon: HelpCircle, to: '/help' },
    { label: 'Billing', icon: CreditCard, to: '/billing' },
  ]

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Profile menu"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'var(--color-accent)',
          color: '#1C1A17',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: '600',
          fontFamily: '"DM Sans", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: '200px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            zIndex: 60,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          {/* User info */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--color-rule)',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--color-ink)' }}>
              {firstName} {lastName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              {user?.email}
            </div>
          </div>

          {/* Menu links */}
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 1rem',
                fontSize: '0.85rem',
                color: 'var(--color-ink)',
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <item.icon size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
              {item.label}
            </Link>
          ))}

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--color-rule)' }} />

          {/* Log out */}
          <button
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 1rem',
              fontSize: '0.85rem',
              color: 'var(--color-ink)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              fontFamily: '"DM Sans", sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}
