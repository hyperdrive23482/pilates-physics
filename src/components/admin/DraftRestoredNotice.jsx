// Shown when an admin editor has put back typing from before a tab reload.
// See src/lib/formDrafts.js.
export default function DraftRestoredNotice({ onDiscard, style }) {
  return (
    <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.8rem', margin: 0, ...style }}>
      Restored your unsaved changes from earlier in this tab.{' '}
      <button
        type="button"
        onClick={onDiscard}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          color: 'var(--color-accent)',
          font: 'inherit',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Discard them
      </button>
    </p>
  )
}
