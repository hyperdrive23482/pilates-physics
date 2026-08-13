import { sectionHeadingStyle } from './proseStyles'

// Walkthrough video for the most common question the calculator gets: how do I
// find the actual weight of the springs I use for footwork?
//
// From the Vimeo share URL https://vimeo.com/<id>/<hash>.
const VIMEO_ID = '1218106807'
const VIMEO_HASH = '6d5f33da15'

// Source is 1920x1080, so the frame fills the tab column at 16:9.
const ASPECT_RATIO = '16 / 9'

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
    </section>
  )
}
