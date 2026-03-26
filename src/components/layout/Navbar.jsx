import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading, signOut } = useEnrollment()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    setMobileOpen(false)
    navigate('/')
  }

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
          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1px' }}
        >
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: '500',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-ink)',
            borderBottom: '1px solid var(--color-accent)',
            paddingBottom: '2px',
            display: 'block',
          }}>
            Pilates
          </span>
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: '500',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            display: 'block',
          }}>
            Physics
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {!loading && user ? (
            <>
              <Link
                to="/course"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#1C1A17',
                  border: '1.5px solid var(--color-accent)',
                  padding: '0.5rem 1.25rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
              >
                My Course
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-ink-muted)',
                  border: '1.5px solid var(--color-rule)',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-accent)',
                  border: '1.5px solid var(--color-accent)',
                  padding: '0.5rem 1.25rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: '#1C1A17',
                  border: '1.5px solid var(--color-accent)',
                  padding: '0.5rem 1.25rem',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  display: 'inline-block',
                }}
              >
                Start Free Course
              </Link>
            </>
          )}
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
            {!loading && user ? (
              <>
                <Link
                  to="/course"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#1C1A17',
                    border: '1.5px solid var(--color-accent)',
                    padding: '0.625rem 1.25rem',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    display: 'block',
                  }}
                >
                  My Course
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-ink-muted)',
                    border: '1.5px solid var(--color-rule)',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    cursor: 'pointer',
                    fontFamily: '"DM Sans", sans-serif',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-accent)',
                    border: '1.5px solid var(--color-accent)',
                    padding: '0.625rem 1.25rem',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    textAlign: 'center',
                    display: 'block',
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#1C1A17',
                    border: '1.5px solid var(--color-accent)',
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
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
