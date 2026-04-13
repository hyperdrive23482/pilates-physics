import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

// Physics constants
const TRAVEL = 18 // inches
const F_START = 10 // lbs at x=0
const F_PEAK = 31 // lbs at x=18"
const K = (F_PEAK - F_START) / TRAVEL // ~1.167 lbs/inch
const INITIAL_POS = 1 / 3 // start 1/3 of the way out

function springForce(normalizedX) {
  return K * (normalizedX * TRAVEL) + F_START
}

// SVG layout constants
const VB_W = 480
const VB_H = 330
const GRAPH = { left: 58, right: 20, top: 24, bottom: 86 }
const AREA = {
  x: GRAPH.left,
  y: GRAPH.top,
  w: VB_W - GRAPH.left - GRAPH.right,
  h: VB_H - GRAPH.top - GRAPH.bottom,
}
const MAX_FORCE = 40

function toGraph(normX, force) {
  return {
    x: AREA.x + normX * AREA.w,
    y: AREA.y + AREA.h - (force / MAX_FORCE) * AREA.h,
  }
}

// Build the force curve path up to a given normalized position
function buildCurvePath(normPos) {
  if (normPos <= 0) return ''
  const steps = Math.max(1, Math.round(normPos * 60))
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const nx = (i / steps) * normPos
    const p = toGraph(nx, springForce(nx))
    pts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
  }
  return pts.join(' ')
}

// Build the filled area path (curve + baseline)
function buildFillPath(normPos) {
  if (normPos <= 0) return ''
  const curvePath = buildCurvePath(normPos)
  const endPt = toGraph(normPos, springForce(normPos))
  const startPt = toGraph(0, springForce(0))
  const baseline = AREA.y + AREA.h
  return `${curvePath} L${endPt.x.toFixed(1)},${baseline} L${startPt.x.toFixed(1)},${baseline} Z`
}

// Generate spring coil zigzag path — end aligns with graph x-axis position
function buildSpringPath(normPos, breathOffset = 0) {
  const coils = 14
  // Spring end x matches the graph dot position
  const endX = AREA.x + normPos * AREA.w + breathOffset
  const startX = AREA.x
  const len = Math.max(8, endX - startX) // minimum length so coils don't collapse
  const baseAmp = 6
  // Amplitude decreases as spring stretches (physically accurate)
  const amp = baseAmp * (1 - normPos * 0.4)
  const y = AREA.y + AREA.h + 28

  let d = `M${startX},${y}`
  const steps = coils * 2
  for (let i = 1; i <= steps; i++) {
    const px = startX + (i / steps) * len
    const py = y + (i % 2 === 0 ? -amp : amp)
    d += ` L${px.toFixed(1)},${py.toFixed(1)}`
  }
  d += ` L${(startX + len).toFixed(1)},${y}`
  return d
}

// Grid lines
const Y_TICKS = [0, 10, 20, 30, 40]
const X_TICKS = [0, 6, 12, 18]

export default function InteractiveSpringDiagram() {
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Use framer-motion spring for smooth physics-based return
  const motionPos = useSpring(INITIAL_POS, { stiffness: 120, damping: 18, mass: 0.8 })
  const [pos, setPos] = useState(INITIAL_POS)

  // Sync motionPos to local state for rendering
  useEffect(() => {
    const unsubscribe = motionPos.on('change', (v) => {
      setPos(Math.max(0, Math.min(1, v)))
    })
    return unsubscribe
  }, [motionPos])

  // Idle breathing animation
  const [breathOffset, setBreathOffset] = useState(0)
  useEffect(() => {
    if (isDragging || Math.abs(pos - INITIAL_POS) > 0.02) {
      setBreathOffset(0)
      return
    }
    let frame
    const start = performance.now()
    function tick(now) {
      const t = (now - start) / 1000
      setBreathOffset(Math.sin(t * 1.2) * 3)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isDragging, pos])

  const getNormPos = useCallback(
    (clientX) => {
      const svg = svgRef.current
      if (!svg) return 0
      const rect = svg.getBoundingClientRect()
      // Map client X to SVG viewBox coordinates
      const svgX = ((clientX - rect.left) / rect.width) * VB_W
      const norm = (svgX - AREA.x) / AREA.w
      return Math.max(0, Math.min(1, norm))
    },
    [],
  )

  const handlePointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDragging(true)
      setHasInteracted(true)
      const n = getNormPos(e.clientX)
      motionPos.jump(n)
    },
    [getNormPos, motionPos],
  )

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return
      const n = getNormPos(e.clientX)
      motionPos.jump(n)
    },
    [isDragging, getNormPos, motionPos],
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    motionPos.set(INITIAL_POS) // spring back to resting position
  }, [motionPos])

  const curvePath = buildCurvePath(pos)
  const fillPath = buildFillPath(pos)
  const springPath = buildSpringPath(pos, !isDragging && Math.abs(pos - INITIAL_POS) < 0.02 ? breathOffset : 0)
  const dotPt = pos > 0.005 ? toGraph(pos, springForce(pos)) : null

  // Force readout
  const currentForce = pos > 0.005 ? springForce(pos) : null
  const currentInches = pos > 0.005 ? (pos * TRAVEL).toFixed(1) : null

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Interactive spring force diagram — drag to stretch"
      style={{ width: '100%', maxWidth: '480px', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      {/* Grid lines */}
      {Y_TICKS.map((lb) => {
        const gy = AREA.y + AREA.h - (lb / MAX_FORCE) * AREA.h
        return (
          <line key={`yg-${lb}`} x1={AREA.x} y1={gy} x2={AREA.x + AREA.w} y2={gy} stroke="#5F5E5A" strokeWidth="1" />
        )
      })}
      {X_TICKS.map((inch) => {
        const gx = AREA.x + (inch / TRAVEL) * AREA.w
        return (
          <line key={`xg-${inch}`} x1={gx} y1={AREA.y} x2={gx} y2={AREA.y + AREA.h} stroke="#5F5E5A" strokeWidth="1" />
        )
      })}

      {/* Axes */}
      <line x1={AREA.x} y1={AREA.y + AREA.h} x2={AREA.x + AREA.w} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />
      <line x1={AREA.x} y1={AREA.y} x2={AREA.x} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />

      {/* Y axis label */}
      <text
        x={16}
        y={AREA.y + AREA.h / 2}
        textAnchor="middle"
        fill="#888780"
        fontSize="10.5"
        fontFamily="DM Sans, sans-serif"
        transform={`rotate(-90, 16, ${AREA.y + AREA.h / 2})`}
      >
        Force (lbs)
      </text>

      {/* Y axis ticks */}
      {Y_TICKS.filter((v) => v > 0).map((lb) => {
        const gy = AREA.y + AREA.h - (lb / MAX_FORCE) * AREA.h
        return (
          <text key={`yt-${lb}`} x={AREA.x - 6} y={gy + 4} textAnchor="end" fill="#888780" fontSize="9" fontFamily="DM Sans, sans-serif">
            {lb}
          </text>
        )
      })}

      {/* X axis label — positioned below the spring coil */}
      <text
        x={AREA.x + AREA.w / 2}
        y={AREA.y + AREA.h + 46}
        textAnchor="middle"
        fill="#888780"
        fontSize="10.5"
        fontFamily="DM Sans, sans-serif"
      >
        Spring extension (inches)
      </text>

      {/* X axis ticks */}
      {X_TICKS.map((inch) => {
        const gx = AREA.x + (inch / TRAVEL) * AREA.w
        return (
          <g key={`xt-${inch}`}>
            <line x1={gx} y1={AREA.y + AREA.h} x2={gx} y2={AREA.y + AREA.h + 5} stroke="#F1EFE8" strokeWidth="1" />
            <text x={gx} y={AREA.y + AREA.h + 18} textAnchor="middle" fill="#888780" fontSize="9" fontFamily="DM Sans, sans-serif">
              {inch}&quot;
            </text>
          </g>
        )
      })}

{/* Full diagonal reference (ghost line showing where the curve goes) */}
      {(() => {
        const start = toGraph(0, springForce(0))
        const end = toGraph(1, springForce(1))
        return (
          <line
            x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke="rgba(239,159,39,0.25)"
            strokeWidth="1.5"
            strokeDasharray="3 4"
          />
        )
      })()}

      {/* Filled area under curve */}
      {fillPath && (
        <path d={fillPath} fill="rgba(239,159,39,0.1)" />
      )}

      {/* Force curve */}
      {curvePath && (
        <path d={curvePath} stroke="#EF9F27" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      )}

      {/* Current position dot */}
      {dotPt && (
        <circle cx={dotPt.x} cy={dotPt.y} r="4.5" fill="#EF9F27" />
      )}

      {/* Force readout near the dot */}
      {dotPt && currentForce && (
        <text
          x={dotPt.x + 8}
          y={dotPt.y - 10}
          fill="#EF9F27"
          fontSize="10"
          fontFamily="DM Sans, sans-serif"
          fontWeight="600"
        >
          {Math.round(currentForce)} lbs @ {currentInches}&quot;
        </text>
      )}

      {/* Spring coil below graph */}
      <path d={springPath} stroke="#EF9F27" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      {/* Spring anchor (left wall) */}
      <line x1={AREA.x} y1={AREA.y + AREA.h + 20} x2={AREA.x} y2={AREA.y + AREA.h + 36} stroke="#888780" strokeWidth="2" />
      {/* Spring label */}
      <text
        x={AREA.x + AREA.w / 2}
        y={AREA.y + AREA.h + 58}
        textAnchor="middle"
        fill="#888780"
        fontSize="9"
        fontFamily="DM Sans, sans-serif"
        style={{ opacity: hasInteracted ? 0 : 1, transition: 'opacity 0.5s' }}
      >
        ← drag to stretch →
      </text>

      {/* F = kx + b label */}
      <text
        x={AREA.x + AREA.w - 4}
        y={AREA.y + 16}
        textAnchor="end"
        fill="rgba(239,159,39,0.6)"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        fontWeight="600"
      >
        F = kx + b
      </text>

      {/* Invisible drag overlay */}
      <rect
        x={0}
        y={0}
        width={VB_W}
        height={VB_H}
        fill="transparent"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </svg>
  )
}
