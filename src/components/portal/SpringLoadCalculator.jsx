import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSpring } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import springSpecs from '../../data/springSpecs.json'
import { expandSelections, combinedConstants, selectionKey } from '../../lib/springMath'

// ----- constants -----
const MAX_TRAVEL = springSpecs.maxTravel // inches
const INITIAL_POS = 1 / 3
const VB_W = 560
const VB_H = 360
const GRAPH = { left: 64, right: 24, top: 28, bottom: 84 }
const AREA = {
  x: GRAPH.left,
  y: GRAPH.top,
  w: VB_W - GRAPH.left - GRAPH.right,
  h: VB_H - GRAPH.top - GRAPH.bottom,
}

// ----- helpers -----
function niceMaxForce(peak) {
  if (peak <= 0) return 20
  const steps = [10, 20, 40, 60, 80, 100, 120, 160, 200, 260, 320, 400, 500]
  for (const s of steps) if (peak * 1.1 <= s) return s
  return Math.ceil((peak * 1.1) / 100) * 100
}

function ticksForMax(maxForce) {
  const count = 5
  const step = maxForce / count
  const out = []
  for (let i = 0; i <= count; i++) out.push(Math.round(i * step))
  return out
}

function toGraph(x, force, maxForce) {
  return {
    x: AREA.x + (x / MAX_TRAVEL) * AREA.w,
    y: AREA.y + AREA.h - (force / maxForce) * AREA.h,
  }
}

function linePath(kTotal, bTotal, maxForce) {
  const start = toGraph(0, bTotal, maxForce)
  const end = toGraph(MAX_TRAVEL, kTotal * MAX_TRAVEL + bTotal, maxForce)
  return `M${start.x.toFixed(1)},${start.y.toFixed(1)} L${end.x.toFixed(1)},${end.y.toFixed(1)}`
}

// ----- sub: Mode toggle -----
function ModeToggle({ mode, onChange }) {
  const options = [
    { value: 'add', label: 'Add' },
    { value: 'compare', label: 'Compare' },
  ]
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        background: 'var(--color-bg)',
      }}
      role="radiogroup"
      aria-label="Calculator mode"
    >
      {options.map((opt) => {
        const active = opt.value === mode
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: '500',
              letterSpacing: '0.02em',
              color: active ? '#1C1A17' : 'var(--color-ink-muted)',
              background: active ? 'var(--color-accent)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ----- sub: Spring selector row -----
function SpringSelectorRow({ selection, onChange, onRemove }) {
  const brand = springSpecs.brands.find((b) => b.id === selection.brandId)
  const selectStyle = {
    width: '100%',
    padding: '0.5rem 0.65rem',
    fontSize: '0.85rem',
    fontFamily: '"DM Sans", sans-serif',
    border: '1px solid var(--color-rule)',
    background: 'var(--color-bg)',
    color: 'var(--color-ink)',
    outline: 'none',
    borderRadius: '2px',
  }
  const qtyStyle = { ...selectStyle, width: '70px', textAlign: 'center' }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 70px auto',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.6rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderLeft: `3px solid ${selection.spring.displayColor}`,
        borderRadius: '2px',
      }}
    >
      <select
        aria-label="Brand"
        value={selection.brandId}
        onChange={(e) => {
          const nextBrand = springSpecs.brands.find((b) => b.id === e.target.value)
          onChange({ ...selection, brandId: nextBrand.id, spring: nextBrand.springs[0] })
        }}
        style={selectStyle}
      >
        {springSpecs.brands.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Spring color"
        value={selection.spring.color}
        onChange={(e) => {
          const nextSpring = brand.springs.find((s) => s.color === e.target.value)
          onChange({ ...selection, spring: nextSpring })
        }}
        style={selectStyle}
      >
        {brand.springs.map((s) => (
          <option key={s.color} value={s.color}>
            {s.label} ({s.tensionLabel})
          </option>
        ))}
      </select>

      <input
        type="number"
        aria-label="Quantity"
        min={1}
        max={9}
        value={selection.quantity}
        onChange={(e) => {
          const n = Math.max(1, Math.min(9, parseInt(e.target.value) || 1))
          onChange({ ...selection, quantity: n })
        }}
        style={qtyStyle}
      />

      <button
        type="button"
        aria-label="Remove spring"
        onClick={onRemove}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '34px',
          height: '34px',
          background: 'transparent',
          border: '1px solid var(--color-rule)',
          color: 'var(--color-ink-muted)',
          cursor: 'pointer',
          borderRadius: '2px',
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ----- sub: Selector panel -----
function SpringSelectorPanel({ selections, setSelections, mode, setMode }) {
  function addSpring() {
    const brand = springSpecs.brands[0]
    const usedColors = new Set(
      selections.filter((s) => s.brandId === brand.id).map((s) => s.spring.color)
    )
    const spring = brand.springs.find((s) => !usedColors.has(s.color)) || brand.springs[0]
    setSelections([...selections, { brandId: brand.id, spring, quantity: 1 }])
  }
  function updateAt(i, next) {
    const copy = selections.slice()
    copy[i] = next
    setSelections(copy)
  }
  function removeAt(i) {
    setSelections(selections.filter((_, j) => j !== i))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <p
          style={{
            fontSize: '0.7rem',
            fontWeight: '600',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            margin: 0,
          }}
        >
          Your Springs
        </p>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {selections.length === 0 ? (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            background: 'var(--color-surface)',
            border: '1px dashed var(--color-rule)',
            color: 'var(--color-ink-muted)',
            fontSize: '0.85rem',
            borderRadius: '2px',
          }}
        >
          Add a spring to begin
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {selections.map((sel, i) => (
            <SpringSelectorRow
              key={`${sel.brandId}-${sel.spring.color}-${i}`}
              selection={sel}
              onChange={(next) => updateAt(i, next)}
              onRemove={() => removeAt(i)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addSpring}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.375rem',
          padding: '0.65rem 1rem',
          fontSize: '0.85rem',
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: '500',
          color: 'var(--color-accent)',
          background: 'transparent',
          border: '1px solid var(--color-accent)',
          cursor: 'pointer',
          borderRadius: '2px',
          alignSelf: 'flex-start',
        }}
      >
        <Plus size={14} /> Add spring
      </button>
    </div>
  )
}

// ----- sub: Force graph -----
function SpringForceGraph({ selections, mode, pos, onPointerDown, onPointerMove, onPointerUp, svgRef, hasInteracted }) {
  // Compute lines based on mode
  const lines = useMemo(() => {
    if (mode === 'add') {
      if (selections.length === 0) return []
      const allSprings = expandSelections(selections)
      const { k, b } = combinedConstants(allSprings)
      return [
        {
          id: 'total',
          label: 'Total',
          color: 'var(--color-accent)',
          strokeColor: '#EF9F27',
          k,
          b,
        },
      ]
    }
    // compare mode: one line per selection (qty baked into the line by multiplying constants)
    return selections.map((sel) => ({
      id: selectionKey(sel),
      label: `${sel.spring.label}${sel.quantity > 1 ? ` ×${sel.quantity}` : ''}`,
      color: sel.spring.displayColor,
      strokeColor: sel.spring.displayColor,
      k: sel.spring.k * sel.quantity,
      b: sel.spring.b * sel.quantity,
    }))
  }, [selections, mode])

  // Auto-scale y-axis
  const peakForce = useMemo(() => {
    let max = 20
    for (const ln of lines) {
      const end = ln.k * MAX_TRAVEL + ln.b
      if (end > max) max = end
    }
    return max
  }, [lines])

  const maxForce = niceMaxForce(peakForce)
  const yTicks = ticksForMax(maxForce)
  const xTicks = [0, 8, 16, 24, 32]

  const cursorX = AREA.x + pos * AREA.w
  const cursorExtension = pos * MAX_TRAVEL

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Spring force vs extension graph. Drag to read values."
      style={{ width: '100%', cursor: 'grab', touchAction: 'none', display: 'block' }}
    >
      {/* Grid */}
      {yTicks.map((lb) => {
        const gy = AREA.y + AREA.h - (lb / maxForce) * AREA.h
        return (
          <line key={`yg-${lb}`} x1={AREA.x} y1={gy} x2={AREA.x + AREA.w} y2={gy} stroke="#2E2B26" strokeWidth="1" />
        )
      })}
      {xTicks.map((inch) => {
        const gx = AREA.x + (inch / MAX_TRAVEL) * AREA.w
        return (
          <line key={`xg-${inch}`} x1={gx} y1={AREA.y} x2={gx} y2={AREA.y + AREA.h} stroke="#2E2B26" strokeWidth="1" />
        )
      })}

      {/* Axes */}
      <line x1={AREA.x} y1={AREA.y + AREA.h} x2={AREA.x + AREA.w} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />
      <line x1={AREA.x} y1={AREA.y} x2={AREA.x} y2={AREA.y + AREA.h} stroke="#F1EFE8" strokeWidth="1.5" />

      {/* Y axis label */}
      <text
        x={18}
        y={AREA.y + AREA.h / 2}
        textAnchor="middle"
        fill="#888780"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
        transform={`rotate(-90, 18, ${AREA.y + AREA.h / 2})`}
      >
        Force (lbs)
      </text>

      {/* Y ticks */}
      {yTicks.map((lb) => {
        const gy = AREA.y + AREA.h - (lb / maxForce) * AREA.h
        return (
          <text key={`yt-${lb}`} x={AREA.x - 8} y={gy + 4} textAnchor="end" fill="#888780" fontSize="10" fontFamily="DM Sans, sans-serif">
            {lb}
          </text>
        )
      })}

      {/* X axis label */}
      <text
        x={AREA.x + AREA.w / 2}
        y={AREA.y + AREA.h + 44}
        textAnchor="middle"
        fill="#888780"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
      >
        Spring extension (inches)
      </text>

      {/* X ticks */}
      {xTicks.map((inch) => {
        const gx = AREA.x + (inch / MAX_TRAVEL) * AREA.w
        return (
          <g key={`xt-${inch}`}>
            <line x1={gx} y1={AREA.y + AREA.h} x2={gx} y2={AREA.y + AREA.h + 5} stroke="#F1EFE8" strokeWidth="1" />
            <text x={gx} y={AREA.y + AREA.h + 18} textAnchor="middle" fill="#888780" fontSize="10" fontFamily="DM Sans, sans-serif">
              {inch}&quot;
            </text>
          </g>
        )
      })}

      {/* Cursor line */}
      {lines.length > 0 && (
        <line
          x1={cursorX}
          y1={AREA.y}
          x2={cursorX}
          y2={AREA.y + AREA.h}
          stroke="#F1EFE8"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity={0.5}
        />
      )}

      {/* Force lines */}
      {lines.map((ln) => {
        const d = linePath(ln.k, ln.b, maxForce)
        return (
          <path
            key={ln.id}
            d={d}
            stroke={ln.strokeColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )
      })}

      {/* Intersection dots + readouts */}
      {lines.map((ln, i) => {
        const force = ln.k * cursorExtension + ln.b
        const pt = toGraph(cursorExtension, force, maxForce)
        // In compare mode with several lines, stack readouts above the graph to avoid overlap
        const readoutY =
          mode === 'compare' && lines.length > 1
            ? AREA.y - 8 + i * 14
            : pt.y - 12
        const readoutX =
          mode === 'compare' && lines.length > 1
            ? AREA.x + AREA.w - 8
            : Math.min(pt.x + 10, AREA.x + AREA.w - 80)
        return (
          <g key={`dot-${ln.id}`}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill={ln.strokeColor} />
            <text
              x={readoutX}
              y={readoutY}
              textAnchor={mode === 'compare' && lines.length > 1 ? 'end' : 'start'}
              fill={ln.strokeColor}
              fontSize="11"
              fontFamily="DM Sans, sans-serif"
              fontWeight="600"
            >
              {ln.label}: {force.toFixed(1)} lbs
            </text>
          </g>
        )
      })}

      {/* Current extension readout (bottom right) */}
      {lines.length > 0 && (
        <text
          x={AREA.x + AREA.w}
          y={AREA.y + AREA.h + 44}
          textAnchor="end"
          fill="var(--color-ink)"
          fontSize="11"
          fontFamily="DM Sans, sans-serif"
          fontWeight="600"
        >
          {cursorExtension.toFixed(1)}&quot; extension
        </text>
      )}

      {/* Hint */}
      {lines.length > 0 && !hasInteracted && (
        <text
          x={AREA.x + AREA.w / 2}
          y={AREA.y + AREA.h / 2}
          textAnchor="middle"
          fill="#888780"
          fontSize="11"
          fontFamily="DM Sans, sans-serif"
          style={{ opacity: 0.8 }}
        >
          drag anywhere on the graph to read the load
        </text>
      )}

      {lines.length === 0 && (
        <text
          x={AREA.x + AREA.w / 2}
          y={AREA.y + AREA.h / 2}
          textAnchor="middle"
          fill="#888780"
          fontSize="12"
          fontFamily="DM Sans, sans-serif"
        >
          Add a spring to see its force curve
        </text>
      )}

      {/* Drag overlay */}
      <rect
        x={AREA.x}
        y={AREA.y}
        width={AREA.w}
        height={AREA.h}
        fill="transparent"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </svg>
  )
}

// ----- sub: Animated coil row -----
function SpringCoils({ selections, pos }) {
  if (selections.length === 0) return null
  const width = 420
  const height = 40 + selections.length * 36
  const coilStart = 40
  const coilEndMax = width - 16

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: `${width}px`, display: 'block', marginTop: '1.25rem' }}
      aria-hidden="true"
    >
      {selections.map((sel, i) => {
        const y = 24 + i * 36
        const stretch = 0.35 + pos * 0.65
        const endX = coilStart + (coilEndMax - coilStart) * stretch
        const coils = 18
        const amp = 7 * (1 - pos * 0.45)
        let d = `M${coilStart},${y}`
        for (let c = 1; c <= coils * 2; c++) {
          const px = coilStart + ((endX - coilStart) * c) / (coils * 2)
          const py = y + (c % 2 === 0 ? -amp : amp)
          d += ` L${px.toFixed(1)},${py.toFixed(1)}`
        }
        d += ` L${endX.toFixed(1)},${y}`
        return (
          <g key={`${sel.brandId}-${sel.spring.color}-${i}`}>
            {/* wall anchor */}
            <line x1={coilStart} y1={y - 12} x2={coilStart} y2={y + 12} stroke="#888780" strokeWidth="2" />
            {/* coil */}
            <path d={d} stroke={sel.spring.displayColor} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            {/* end cap */}
            <circle cx={endX} cy={y} r="3" fill={sel.spring.displayColor} />
            {/* label */}
            <text
              x={coilStart - 8}
              y={y + 3}
              textAnchor="end"
              fill="#888780"
              fontSize="10"
              fontFamily="DM Sans, sans-serif"
            >
              {sel.spring.label}
              {sel.quantity > 1 ? ` ×${sel.quantity}` : ''}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ----- main -----
export default function SpringLoadCalculator() {
  const svgRef = useRef(null)
  const [selections, setSelections] = useState(() => [
    { brandId: 'balanced-body', spring: springSpecs.brands[0].springs[2], quantity: 1 },
  ])
  const [mode, setMode] = useState('add')
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const motionPos = useSpring(INITIAL_POS, { stiffness: 120, damping: 18, mass: 0.8 })
  const [pos, setPos] = useState(INITIAL_POS)

  useEffect(() => {
    const unsub = motionPos.on('change', (v) => setPos(Math.max(0, Math.min(1, v))))
    return unsub
  }, [motionPos])

  const getNormPos = useCallback((clientX) => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / rect.width) * VB_W
    const norm = (svgX - AREA.x) / AREA.w
    return Math.max(0, Math.min(1, norm))
  }, [])

  const handlePointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDragging(true)
      setHasInteracted(true)
      motionPos.jump(getNormPos(e.clientX))
    },
    [getNormPos, motionPos]
  )
  const handlePointerMove = useCallback(
    (e) => {
      if (!isDragging) return
      motionPos.jump(getNormPos(e.clientX))
    },
    [isDragging, getNormPos, motionPos]
  )
  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    motionPos.set(INITIAL_POS)
  }, [motionPos])

  return (
    <div className="spring-calc-root">
      <div className="spring-calc-grid">
        <aside className="spring-calc-panel">
          <SpringSelectorPanel
            selections={selections}
            setSelections={setSelections}
            mode={mode}
            setMode={setMode}
          />
        </aside>

        <section className="spring-calc-graph">
          <SpringForceGraph
            selections={selections}
            mode={mode}
            pos={pos}
            svgRef={svgRef}
            hasInteracted={hasInteracted}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          <SpringCoils selections={selections} pos={pos} />
        </section>
      </div>

      <style>{`
        .spring-calc-root {
          width: 100%;
        }
        .spring-calc-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 2rem;
          align-items: start;
        }
        .spring-calc-panel {
          min-width: 0;
        }
        .spring-calc-graph {
          min-width: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          padding: 1.25rem;
          border-radius: 2px;
        }
        @media (max-width: 860px) {
          .spring-calc-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}
