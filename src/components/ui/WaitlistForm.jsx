/**
 * WaitlistForm — kit.com embed wrapper
 *
 * Once you have the kit.com form ID, replace the placeholder
 * below with the embed script/markup from kit.com.
 */
export default function WaitlistForm({ className = '', style = {} }) {
  return (
    <div className={className} style={style}>
      {/* ──────────────────────────────────────────────────
          KIT.COM EMBED GOES HERE

          Replace this placeholder with your kit.com form embed.
          Typical kit.com embed looks like:

          <script async data-uid="FORM_ID"
            src="https://YOURACCOUNT.kit.com/FORM_ID/index.js">
          </script>

          Or for React, use a useEffect + ref approach:

          const ref = useRef(null)
          useEffect(() => {
            const script = document.createElement('script')
            script.src = 'https://YOURACCOUNT.kit.com/FORM_ID/index.js'
            script.async = true
            script.dataset.uid = 'FORM_ID'
            ref.current.appendChild(script)
          }, [])
          ────────────────────────────────────────────────── */}

      {/* Placeholder UI — remove once real embed is in place */}
      <div
        style={{
          padding: '1.5rem 2rem',
          border: '1.5px dashed var(--color-accent)',
          background: 'var(--color-surface)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <p
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '1.1rem',
            color: 'var(--color-ink)',
            margin: 0,
          }}
        >
          Join the Waitlist
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-ink-muted)',
            margin: 0,
          }}
        >
          Kit.com signup form coming soon.
        </p>
      </div>
    </div>
  )
}
