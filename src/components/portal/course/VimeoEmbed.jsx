import { useEffect, useRef } from 'react'
import { vimeoEmbedSrc } from '../../../lib/vimeo'

const PLAYER_ORIGIN = 'https://player.vimeo.com'

/**
 * A course module's video.
 *
 * Generalised from springs101/FootworkVideo, which hard-codes one id. Chrome
 * is stripped back and dnt=1 keeps Vimeo from tracking our viewers.
 *
 * onEnded is best effort. It uses the player's postMessage API rather than the
 * Vimeo SDK, which keeps a script off the page for a signal nothing depends
 * on: courses never gate on playback, so a missed 'ended' costs a tick on a
 * progress bar and nothing else.
 */
export default function VimeoEmbed({ id, hash, title, onEnded }) {
  const frameRef = useRef(null)
  // Kept in a ref so the listener does not need re-binding when the callback
  // identity changes on a parent render.
  const endedRef = useRef(onEnded)
  useEffect(() => {
    endedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    if (!id) return

    function subscribe() {
      const win = frameRef.current?.contentWindow
      if (!win) return
      win.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), PLAYER_ORIGIN)
    }

    function onMessage(e) {
      if (e.origin !== PLAYER_ORIGIN) return
      if (e.source !== frameRef.current?.contentWindow) return

      let data = e.data
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data)
        } catch {
          return
        }
      }
      if (!data || typeof data !== 'object') return

      // The player announces itself before it will accept listeners.
      if (data.event === 'ready') subscribe()
      if (data.event === 'ended') endedRef.current?.()
    }

    window.addEventListener('message', onMessage)
    // Belt and braces: if the iframe was already loaded when this mounted, the
    // ready event has been and gone.
    subscribe()
    return () => window.removeEventListener('message', onMessage)
  }, [id])

  if (!id) return null

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: '2px',
        overflow: 'hidden',
        background: 'var(--color-surface)',
      }}
    >
      <iframe
        ref={frameRef}
        src={vimeoEmbedSrc({ id, hash }, { api: true })}
        title={title || 'Course module'}
        onLoad={() => {
          frameRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value: 'ended' }),
            PLAYER_ORIGIN,
          )
        }}
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  )
}
