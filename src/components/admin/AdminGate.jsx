import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../../hooks/useAdmin'

export default function AdminGate({ children }) {
  const { isAdmin, user, loading } = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
    } else if (!isAdmin) {
      navigate('/portal', { replace: true })
    }
  }, [loading, user, isAdmin, navigate])

  if (loading || !user || !isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"DM Sans", sans-serif',
          color: 'var(--color-ink-muted)',
          fontSize: '0.9rem',
        }}
      >
        Loading...
      </div>
    )
  }

  return children
}
