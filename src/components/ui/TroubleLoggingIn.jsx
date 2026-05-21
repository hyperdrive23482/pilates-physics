import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'

const pointStyle = {
  margin: '0 0 0.85rem',
  fontSize: '0.85rem',
  lineHeight: '1.6',
  color: 'var(--color-ink-muted)',
}

const leadStyle = { color: 'var(--color-ink)', fontWeight: '600' }

const linkStyle = { color: 'var(--color-accent)', textDecoration: 'underline' }

/**
 * Collapsible self-service help for anyone stuck on an auth page. The copy lives
 * here so it stays identical wherever the accordion is dropped in (login,
 * expired-link notice, password reset, set password).
 */
export default function TroubleLoggingIn() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-rule)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="trouble-logging-in-panel"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.95rem 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-serif)',
          fontSize: '0.9rem',
          color: 'var(--color-ink)',
          textAlign: 'left',
        }}
      >
        Trouble logging in?
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: 'var(--color-ink-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {open && (
        <div id="trouble-logging-in-panel" style={{ paddingBottom: '1rem' }}>
          <p style={pointStyle}>
            <strong style={leadStyle}>Didn't get the email?</strong> Give it a minute, then
            check your spam or junk folder. It comes from noreply@mail.pilatesphysics.com.
          </p>
          <p style={pointStyle}>
            <strong style={leadStyle}>Link or code not working?</strong> Each one can be used
            once and expires after a while. Request a fresh email and use the most recent one.
            If a link does nothing, open it in your normal browser (Safari or Chrome) instead
            of the email app.
          </p>
          <p style={pointStyle}>
            <strong style={leadStyle}>Not sure which email you used?</strong> Use the address
            you gave when you bought a workshop or signed up. If you have more than one, try
            each.
          </p>
          <p style={{ ...pointStyle, marginBottom: 0 }}>
            <strong style={leadStyle}>Still stuck?</strong> Email{' '}
            <a href="mailto:hello@pilatesphysics.com" style={linkStyle}>
              hello@pilatesphysics.com
            </a>{' '}
            or visit our{' '}
            <Link to="/help" style={linkStyle}>
              Help page
            </Link>
            , and tell us the email you are trying to use.
          </p>
        </div>
      )}
    </div>
  )
}
