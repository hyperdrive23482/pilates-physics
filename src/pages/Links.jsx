import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import NewsletterForm from '../components/ui/NewsletterForm'
import '../styles/ppv2.css'
import './Links.css'

// Link-in-bio page for the Pilates Physics social profiles — the destination
// behind the Instagram bio link.
//
// The spring calculator is the only primary (.btn) button in the stack, so the
// lead magnet is the one amber thing in it; everything else is a ghost button.
// Keep it that way — add a second filled button and neither reads as the ask.
//
// "Main Website" points at '/' rather than an absolute URL: this page is served
// from pilatesphysics.com, so '/' is PilatesPhysics.com, and routing it through
// react-router avoids a full page reload.
const LINK_ITEMS = [
  {
    label: 'Free Spring Calculator',
    href: '/spring-calculator',
    primary: true,
  },
  {
    label: 'Pilates Physics Education',
    href: '/education',
  },
  {
    label: 'Remo: Pilates Intelligence Platform',
    href: 'https://www.RemoPilates.com',
    external: true,
  },
  {
    label: 'Pilates Physics Blog',
    href: '/blog',
  },
  {
    label: 'Main Website',
    href: '/',
  },
]

export default function Links() {
  return (
    <div className="ppv2 grid-bg links-page">
      <section className="links-panel section-frame">
        <span className="cross tl" />
        <span className="cross tr" />
        <span className="cross bl" />
        <span className="cross br" />

        <div className="links-shell">
          {/* ── Identity ───────────────────────────────────────────────── */}
          <div className="links-id">
            <h1 className="links-wordmark">
              <span className="links-wordmark__pilates">Pilates</span>
              <span className="links-wordmark__physics">Physics</span>
            </h1>
            <p className="links-role">
              Kaleen Canevari · Pilates instructor · Mechanical engineer
            </p>
          </div>

          {/* ── Links ──────────────────────────────────────────────────── */}
          <nav className="links-list" aria-label="Pilates Physics links">
            {LINK_ITEMS.map((item) => {
              const className = `btn btn--block${item.primary ? '' : ' btn--ghost'}`

              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {item.label}
                  <ArrowSvg />
                </a>
              ) : (
                <Link key={item.label} to={item.href} className={className}>
                  {item.label}
                  <ArrowSvg />
                </Link>
              )
            })}
          </nav>

          {/* ── Newsletter ─────────────────────────────────────────────── */}
          <div className="links-signup">
            <div className="kicker">Newsletter</div>
            <h2 className="links-signup__head">
              Occasional notes on the <span className="italic accent">physics</span> of Pilates
              equipment.
            </h2>
            {/* `compact` suppresses the header and subheader configured in Kit,
             * since the heading above already does that job. Links.css puts the
             * fields back into a column for this narrow layout. */}
            <NewsletterForm compact className="links-signup__form" />
          </div>
        </div>
      </section>
    </div>
  )
}
