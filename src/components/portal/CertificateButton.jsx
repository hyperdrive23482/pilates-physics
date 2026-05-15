import { Link } from 'react-router-dom'
import { Award } from 'lucide-react'
import { useCertificateDownload } from '../../hooks/useCertificateDownload'

const ACCENT = 'var(--color-accent)'

export default function CertificateButton({ workshop, user }) {
  const { download, busy, error } = useCertificateDownload()

  const meta = user?.user_metadata ?? {}
  const hasName = Boolean(
    (meta.first_name && meta.first_name.trim()) ||
      (meta.last_name && meta.last_name.trim())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={() => download(workshop)}
        disabled={busy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          width: '100%',
          padding: '1rem 1.25rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-rule)',
          textAlign: 'left',
          fontFamily: 'inherit',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!busy) e.currentTarget.style.borderColor = ACCENT
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-rule)'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${ACCENT}15`,
            borderRadius: '4px',
            flexShrink: 0,
          }}
        >
          <Award size={18} style={{ color: ACCENT }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: '500',
              color: 'var(--color-ink)',
            }}
          >
            {busy ? 'Preparing certificate…' : 'Download Certificate of Completion'}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-ink-muted)',
              marginTop: '0.2rem',
              lineHeight: '1.5',
            }}
          >
            PDF · {workshop.title}
          </div>
        </div>
      </button>

      {!hasName && (
        <p
          style={{
            margin: 0,
            fontSize: '0.78rem',
            color: 'var(--color-ink-muted)',
            lineHeight: '1.5',
          }}
        >
          Add your name in{' '}
          <Link
            to="/profile"
            style={{ color: 'var(--color-accent)', textDecoration: 'none' }}
          >
            Profile
          </Link>{' '}
          to personalize this certificate.
        </p>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#ff7d7d' }}>{error}</p>
      )}
    </div>
  )
}
