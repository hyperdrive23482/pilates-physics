import { useRef, useState, useEffect } from 'react'

export default function TestimonialCarousel({ images = [] }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function updateScrollState() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [])

  function scroll(dir) {
    const el = scrollRef.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).gap) || 20
    const cardWidth = el.querySelector('img')?.offsetWidth || 400
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' })
  }

  if (images.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="testimonial-scroll"
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.5rem',
        }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img.src}
            alt={img.alt || `Testimonial ${i + 1}`}
            style={{
              height: '160px',
              width: '400px',
              borderRadius: '12px',
              scrollSnapAlign: 'center',
              flexShrink: 0,
              objectFit: 'cover',
              border: '2px solid var(--color-accent)',
            }}
          />
        ))}
      </div>

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="carousel-arrow carousel-arrow-left"
          style={{
            position: 'absolute',
            left: '-1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-surface-raised)',
            color: 'var(--color-ink)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          &#8592;
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="carousel-arrow carousel-arrow-right"
          style={{
            position: 'absolute',
            right: '-1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid var(--color-rule)',
            background: 'var(--color-surface-raised)',
            color: 'var(--color-ink)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          &#8594;
        </button>
      )}

      {/* Hide scrollbar */}
      <style>{`
        .testimonial-scroll::-webkit-scrollbar { display: none; }
        .testimonial-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
