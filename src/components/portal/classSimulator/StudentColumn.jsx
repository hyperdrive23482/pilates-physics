import SpringPicker from './SpringPicker'
import { SegmentedToggle, FieldLabel } from './ui'
import { FOOTBAR_OPTIONS, GEAR_OPTIONS, GRIP_OPTIONS, springSummary } from './exercises'

function BigStat({ label, lbs, sub }) {
  return (
    <div>
      <div
        style={{
          fontSize: '0.62rem',
          fontFamily: 'var(--font-mono, monospace)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-ink-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.6rem',
          fontWeight: 600,
          color: 'var(--color-ink)',
          lineHeight: 1.15,
        }}
      >
        {lbs}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 400,
            color: 'var(--color-ink-muted)',
            marginLeft: '0.2rem',
          }}
        >
          lbs
        </span>
      </div>
      {sub && <div style={{ fontSize: '0.68rem', color: 'var(--color-ink-muted)' }}>{sub}</div>}
    </div>
  )
}

// One student's card for the current exercise: springs, equipment
// variations, exercise toggles, and the resulting load readouts.
export default function StudentColumn({ student, exercise, cfg, onPatch }) {
  const result = exercise.compute(student, cfg)
  const controls = exercise.controls || []

  return (
    <div
      style={{
        padding: '1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        borderRadius: '2px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--color-ink)',
          }}
        >
          {student.name || 'Student'}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-ink-muted)' }}>
          {student.heightIn}" · {student.weightLb} lbs ·{' '}
          {student.gender === 'woman' ? 'Woman' : 'Man'}
        </div>
      </div>

      <div>
        <FieldLabel>Springs · {springSummary(cfg.springs)}</FieldLabel>
        <SpringPicker counts={cfg.springs} onChange={(springs) => onPatch({ springs })} />
      </div>

      {controls.includes('footbar') && (
        <div>
          <FieldLabel>Footbar height</FieldLabel>
          <SegmentedToggle
            size="sm"
            fullWidth
            ariaLabel="Footbar height"
            value={cfg.footbar}
            onChange={(footbar) => onPatch({ footbar })}
            options={FOOTBAR_OPTIONS}
          />
        </div>
      )}

      {controls.includes('gear') && (
        <div>
          <FieldLabel>Gear position</FieldLabel>
          <SegmentedToggle
            size="sm"
            fullWidth
            ariaLabel="Gear position"
            value={cfg.gear}
            onChange={(gear) => onPatch({ gear })}
            options={GEAR_OPTIONS}
          />
        </div>
      )}

      {controls.includes('grip') && (
        <div>
          <FieldLabel>Grip</FieldLabel>
          <SegmentedToggle
            size="sm"
            fullWidth
            ariaLabel="Strap grip"
            value={cfg.grip}
            onChange={(grip) => onPatch({ grip })}
            options={GRIP_OPTIONS}
          />
        </div>
      )}

      {exercise.toggles?.length > 0 && (
        <div>
          <FieldLabel>Variations</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {exercise.toggles.map((toggle) => {
              const active = !!cfg.toggles?.[toggle.id]
              return (
                <button
                  key={toggle.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    onPatch({ toggles: { ...cfg.toggles, [toggle.id]: !active } })
                  }
                  style={{
                    padding: '0.35rem 0.7rem',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-serif)',
                    border: '1px solid var(--color-rule)',
                    borderRadius: '999px',
                    background: active ? 'var(--color-accent)' : 'var(--color-bg)',
                    color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {toggle.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div
        style={{
          borderTop: '1px solid var(--color-rule)',
          paddingTop: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {result.rows.map((row) => (
            <BigStat key={row.label} label={row.label} lbs={row.lbs} sub={row.sub} />
          ))}
        </div>
        {result.bodyRows?.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--color-rule)',
              paddingTop: '0.6rem',
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
            }}
          >
            {result.bodyRows.map((row) => (
              <BigStat
                key={`${row.label}-${row.sub}`}
                label={row.label}
                lbs={row.lbs}
                sub={row.sub}
              />
            ))}
          </div>
        )}
        {result.extras?.map((extra) => (
          <div
            key={extra.id}
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              color: 'var(--color-ink-muted)',
            }}
          >
            {extra.text}
          </div>
        ))}
      </div>
    </div>
  )
}
