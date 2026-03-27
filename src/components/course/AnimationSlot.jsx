import { useEffect, useRef, useState } from 'react'

const animationMap = {
  'm1-l1-spring': { src: '/animations/spring-animation.html' },
  'm1-l1-tall-short': { src: '/animations/tall-short-animation.html' },
  'm1-l3': { src: '/animations/elastic-plastic-animation.html' },
}

export function AnimationSlot({ animationId }) {
  const anim = animationMap[animationId]
  const iframeRef = useRef(null)
  const [height, setHeight] = useState(400)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    function resizeToContent() {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document
        if (doc?.body) {
          setHeight(doc.body.scrollHeight)
        }
      } catch {
        // cross-origin fallback — keep current height
      }
    }

    iframe.addEventListener('load', resizeToContent)

    // Also watch for resize events inside the iframe
    function handleResize() {
      resizeToContent()
    }

    iframe.addEventListener('load', () => {
      try {
        iframe.contentWindow?.addEventListener('resize', handleResize)
      } catch {
        // cross-origin, ignore
      }
    })

    return () => {
      iframe.removeEventListener('load', resizeToContent)
      try {
        iframe.contentWindow?.removeEventListener('resize', handleResize)
      } catch {
        // ignore
      }
    }
  }, [animationId])

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
        ref={iframeRef}
        src={anim.src}
        title="Interactive animation"
        style={{
          width: '100%',
          height: `${height}px`,
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
