export default function Badge({ children, color = 'var(--color-accent)', outline = false }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.62rem',
        fontWeight: '600',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '0.2rem 0.5rem',
        background: outline ? 'transparent' : color,
        color: outline ? color : '#fff',
        border: outline ? `1px solid ${color}` : 'none',
        lineHeight: '1',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
