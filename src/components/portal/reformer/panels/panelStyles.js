// Shared style objects for panel inputs. Lives apart from PanelShell.jsx so
// the latter can be a pure components-only export (react-refresh).

export const panelInputStyle = {
  width: '100%',
  padding: '0.4rem 0.55rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.78rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  outline: 'none',
  borderRadius: '2px',
  boxSizing: 'border-box',
}

export const panelLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-ink-muted)',
}
