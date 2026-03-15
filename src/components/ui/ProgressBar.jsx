export default function ProgressBar({ percent, color = 'var(--color-accent)', height = 3, className = '' }) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: `${height}px`,
        background: 'var(--color-rule)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          height: '100%',
          background: color,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}
