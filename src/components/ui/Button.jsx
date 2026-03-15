import { Link } from 'react-router-dom'

const baseStyles = {
  display: 'inline-block',
  padding: '0.75rem 1.5rem',
  fontSize: '0.9rem',
  fontWeight: '500',
  cursor: 'pointer',
  border: 'none',
  textDecoration: 'none',
  lineHeight: '1',
  fontFamily: '"DM Sans", sans-serif',
}

const variantStyles = {
  primary: {
    backgroundColor: 'var(--color-accent)',
    color: '#1C1A17',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-ink)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-accent)',
    border: 'none',
    padding: '0',
    textDecoration: 'underline',
  },
}

export default function Button({
  children,
  variant = 'primary',
  href,
  onClick,
  type = 'button',
  className = '',
}) {
  const combinedStyle = {
    ...baseStyles,
    ...variantStyles[variant],
  }

  if (href) {
    if (href.startsWith('/')) {
      return (
        <Link to={href} style={combinedStyle} className={className}>
          {children}
        </Link>
      )
    }
    return (
      <a href={href} style={combinedStyle} className={className}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      style={combinedStyle}
      className={className}
    >
      {children}
    </button>
  )
}
