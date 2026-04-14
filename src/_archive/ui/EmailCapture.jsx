import { useState } from 'react'

export default function EmailCapture({ onSuccess, className = '' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')

    // Phase 5 will wire this to ConvertKit. For now, simulate success.
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      localStorage.setItem('pp_enrolled', 'true')
      setStatus('success')
      if (onSuccess) onSuccess()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className={className} style={{ color: 'var(--color-accent)' }}>
        <p style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.25rem' }}>
          You're in. Check your inbox.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
          style={{
            flex: '1',
            minWidth: '220px',
            padding: '0.75rem 1rem',
            fontSize: '0.9rem',
            fontFamily: '"DM Sans", sans-serif',
            border: '1px solid var(--color-rule)',
            borderRight: 'none',
            background: 'var(--color-surface)',
            color: 'var(--color-ink)',
            outline: 'none',
            borderRadius: '0',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '500',
            fontFamily: '"DM Sans", sans-serif',
            background: 'var(--color-accent)',
            color: '#1C1A17',
            border: 'none',
            cursor: status === 'loading' ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            borderRadius: '0',
          }}
        >
          {status === 'loading' ? 'Starting…' : 'Start the Free Course'}
        </button>
      </div>
      {status === 'error' && (
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
          Something went wrong. Try again.
        </p>
      )}
    </form>
  )
}
