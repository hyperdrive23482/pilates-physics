import { proseStyle, sectionHeadingStyle } from './proseStyles'

// Walkthrough video for the most common question the calculator gets: how do I
// find the actual weight of the springs I use for footwork?
//
// From the Vimeo share URL https://vimeo.com/<id>/<hash>.
const VIMEO_ID = '1218106807'
const VIMEO_HASH = '6d5f33da15'

// The video is portrait (a phone recording). Vimeo's own embed snippet sizes it
// with padding-top:117.76%, i.e. height = 1.1776 x width, so the frame is
// 100/117.76. Left as the ratio from that number rather than a rounded 9:16 so
// there are no black bars.
const ASPECT_RATIO = '100 / 117.76'

// A portrait video at the full 720px column would be ~850px tall and swallow the
// page, so cap the width and centre it.
const MAX_WIDTH = '400px'

const TITLE = 'How to see your footwork spring weights'

function playerSrc() {
  const params = new URLSearchParams({
    badge: '0',
    autopause: '0',
    title: '0',
    byline: '0',
    portrait: '0',
    dnt: '1', // no Vimeo session tracking of our viewers
  })
  if (VIMEO_HASH) params.set('h', VIMEO_HASH)
  return `https://player.vimeo.com/video/${VIMEO_ID}?${params}`
}

export default function FootworkVideo() {
  return (
    <section className="spring-calc-video">
      <h2 style={sectionHeadingStyle}>{TITLE}</h2>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: MAX_WIDTH,
          margin: '0 auto',
          aspectRatio: ASPECT_RATIO,
          borderRadius: '2px',
          overflow: 'hidden',
          background: 'var(--color-surface)',
        }}
      >
        <iframe
          src={playerSrc()}
          title={TITLE}
          loading="lazy"
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

      <p style={{ ...proseStyle, marginTop: '1.5rem', marginBottom: 0 }}>
        A short walkthrough of reading your own footwork load off the graph above:
        pick your apparatus and brand, add the springs you actually use, then drag
        across the graph to the extension footwork lives at.
      </p>
    </section>
  )
}
