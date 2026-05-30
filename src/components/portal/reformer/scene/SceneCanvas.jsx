// The SVG canvas the scene draws into. Hosts the grid background, the
// reformer + body layers, and (later) springs / ropes / force vectors.
//
// Child layers receive their geometry as props. SceneCanvas owns the ref to
// the <svg> element so drag handlers can convert client pixels to SVG coords.

import { forwardRef } from 'react'
import { VB_W, VB_H } from './coords.js'

const SceneCanvas = forwardRef(function SceneCanvas({ children, ariaLabel = 'Reformer scene' }, ref) {
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      style={{
        width: '100%',
        height: 'auto',
        display: 'block',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-rule)',
        touchAction: 'none',
      }}
    >
      {/* Grid background */}
      <defs>
        <pattern id="reformer-grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-grid)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={VB_W} height={VB_H} fill="url(#reformer-grid)" />

      {children}
    </svg>
  )
})

export default SceneCanvas
