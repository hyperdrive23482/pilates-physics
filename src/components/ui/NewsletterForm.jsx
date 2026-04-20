import { useEffect, useRef } from 'react'

const KIT_UID = 'fcf1f6c520'
const KIT_SRC = `https://pilates-physics.kit.com/${KIT_UID}/index.js`

export default function NewsletterForm({ className = '', style = {}, compact = false }) {
  const wrapperClass = `pp-kit-form${compact ? ' pp-kit-form--compact' : ''} ${className}`.trim()
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (el.querySelector(`script[src="${KIT_SRC}"]`)) return

    const script = document.createElement('script')
    script.src = KIT_SRC
    script.async = true
    script.dataset.uid = KIT_UID
    el.appendChild(script)
  }, [])

  return (
    <div
      ref={containerRef}
      className={wrapperClass}
      style={style}
    />
  )
}
