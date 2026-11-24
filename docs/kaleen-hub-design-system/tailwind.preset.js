// Kaleen Hub design system: Tailwind preset.
// Usage in tailwind.config.ts:  presets: [require('./kaleen-hub-design-system/tailwind.preset.js')]
// Mirrors tokens.css. If a value changes, change it in both files.

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        hub: {
          bg: '#F5F4EF',
          ink: '#14213D',
          muted: '#3B4660',
          label: '#5A6480',
          accent: '#1D4ED8',
          panel: '#FFFFFF',
          rule: '#C3C7D2',
          'rule-faint': '#D5D8E0',
          'on-ink-muted': '#C5CBDA',
        },
      },
      fontFamily: {
        'hub-head': ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        'hub-body': ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        'hub-mono': ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'hub-h1': ['clamp(46px, 6.6vw, 82px)', { lineHeight: '0.98', letterSpacing: '-0.045em', fontWeight: '700' }],
        'hub-h2': ['clamp(28px, 3.4vw, 38px)', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '700' }],
        'hub-h3': ['26px', { lineHeight: '1.2', letterSpacing: '-0.03em', fontWeight: '700' }],
        'hub-title': ['24px', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        'hub-lede': ['19px', { lineHeight: '1.55' }],
        'hub-body': ['16px', { lineHeight: '1.65' }],
        'hub-small': ['15px', { lineHeight: '1.5' }],
        'hub-mono': ['13px', { letterSpacing: '0.04em' }],
        'hub-caption': ['12px', { letterSpacing: '0.04em' }],
        'hub-label': ['11px', { letterSpacing: '0.1em' }],
      },
      borderWidth: { hub: '1.5px' },
      maxWidth: { hub: '1152px' },
      backgroundImage: {
        'hub-grid':
          'linear-gradient(rgba(20,33,61,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,33,61,0.06) 1px, transparent 1px)',
      },
      backgroundSize: { 'hub-grid': '24px 24px' },
    },
  },
};
