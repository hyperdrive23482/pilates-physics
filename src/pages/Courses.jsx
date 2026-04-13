export default function Courses() {
  return (
    <div>
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '7rem 2rem 5rem',
          }}
        >
          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: '500',
              fontSize: '2.5rem',
              letterSpacing: '-0.01em',
              color: 'var(--color-ink)',
              margin: '0 0 1rem',
            }}
          >
            Courses
          </h1>
          <p
            style={{
              color: 'var(--color-ink-muted)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              maxWidth: '640px',
            }}
          >
            Course catalog coming soon. Check back for upcoming offerings on
            Pilates, biomechanics, and applied physics for movement.
          </p>
        </div>
      </section>
    </div>
  )
}
