const animationMap = {
  'm1-l1-spring': { src: '/animations/spring-animation.html', height: 520 },
  'm1-l1-tall-short': { src: '/animations/tall-short-animation.html', height: 580 },
  'm1-l3': { src: '/animations/elastic-plastic-animation.html', height: 480 },
}

export function AnimationSlot({ animationId }) {
  const anim = animationMap[animationId]

  if (!anim) {
    return (
      <div
        style={{
          width: '100%',
          minHeight: '300px',
          border: '1px dashed var(--color-rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
          borderRadius: '8px',
          margin: '2rem 0',
        }}
        aria-label="Interactive animation"
      >
        <span style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)' }}>
          Interactive diagram
        </span>
      </div>
    )
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      <iframe
        src={anim.src}
        title="Interactive animation"
        style={{
          width: '100%',
          height: `${anim.height}px`,
          border: 'none',
          borderRadius: '8px',
          display: 'block',
        }}
        scrolling="no"
        loading="lazy"
      />
    </div>
  )
}
