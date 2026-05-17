import { useParams, Link } from 'react-router-dom'
import { useWorkshop } from '../hooks/useWorkshops'
import RegisterCard from '../components/ui/RegisterCard'
import StatusBadge from '../components/portal/StatusBadge'
import ArrowSvg from '../components/ui/ArrowSvg'
import '../styles/ppv2.css'
import './Workshop.css'

const INCLUDED = [
  {
    n: '01',
    label: 'LIVE SESSION',
    title: 'Live Session',
    body: 'Real-time instruction with live Q&A. Ask questions, get answers, go deeper on the topics that matter to your practice.',
  },
  {
    n: '02',
    label: 'RECORDING',
    title: 'Full Recording',
    body: "Can't attend live? The full recording is shared within 24 hours and available in your portal.",
  },
  {
    n: '03',
    label: 'RESOURCES',
    title: 'Downloadable Resources',
    body: 'Reference materials and resources you can use in the studio, available before and after the session.',
  },
]

export default function WorkshopSalesPage() {
  const { slug } = useParams()
  const { workshop, loading } = useWorkshop(slug)

  if (loading) {
    return (
      <div className="ppv2 grid-bg">
        <section className="workshop-state">
          <p className="workshop-state__msg">Loading…</p>
        </section>
      </div>
    )
  }

  if (!workshop) {
    return (
      <div className="ppv2 grid-bg">
        <section className="workshop-state">
          <h1 className="workshop-state__head">Workshop not found</h1>
          <Link to="/education" className="arrow-link">Browse all programs →</Link>
        </section>
      </div>
    )
  }

  const date = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  const time = workshop.scheduled_at
    ? new Date(workshop.scheduled_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : null

  const price = workshop.price_cents
    ? `$${(workshop.price_cents / 100).toFixed(0)}`
    : 'Free'

  const heroStyle = workshop.hero_image_url
    ? { '--workshop-hero-image': `url(${workshop.hero_image_url})` }
    : undefined

  const specs = [
    { k: 'Date', v: date || 'TBD' },
    { k: 'Time', v: time || 'TBD' },
    { k: 'Duration', v: workshop.duration_min ? `${workshop.duration_min} minutes` : 'TBD' },
    { k: 'Format', v: 'Live via Zoom · recording included' },
    { k: 'Price', v: price },
  ]

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      {/* ── § 01 Hero ────────────────────────────────────────────────────── */}
      <section className="workshop-hero section-frame" style={heroStyle}>
        <span className="cross tl"></span>
        <span className="cross tr"></span>

        <div className="container">
          <div className="workshop-hero__inner">
            <div className="kicker" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>§ 01 · Live Workshop</span>
              <StatusBadge status={workshop.status} />
            </div>
            <h1 className="workshop-hero__title">{workshop.title}</h1>
            {workshop.subtitle && (
              <p className="workshop-hero__lede">{workshop.subtitle}</p>
            )}

            <div className="workshop-hero__cta">
              <a href="#register" className="btn btn--lg">
                Register Now — {price}
                <ArrowSvg />
              </a>
            </div>
            {date && (
              <p className="workshop-hero__meta">
                <span className="workshop-hero__meta-k">Live</span>{date} · recording included
              </p>
            )}
          </div>
        </div>

        <span className="cross bl"></span>
        <span className="cross br"></span>
      </section>

      {/* ── § 02 Details + Register ──────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-details">
        <div className="container">
          <div className="workshop-details__grid">
            <div>
              <div className="kicker">§ 02 · Details</div>
              <h2 className="workshop-details__head">The <span className="italic accent">specs.</span></h2>

              <dl className="spec-list">
                {specs.map((s) => (
                  <div className="spec-list__row" key={s.k}>
                    <dt className="spec-list__k">{s.k}</dt>
                    <dd className="spec-list__v">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div id="register" className="workshop-details__register">
              <RegisterCard workshop={workshop} />
            </div>
          </div>
        </div>
      </section>

      {/* ── § 03 What's included ─────────────────────────────────────────── */}
      <section className="section-pad section--inset workshop-included">
        <div className="container">
          <div className="kicker">§ 03 · What's included</div>
          <h2 className="workshop-included__head">
            Every registration <span className="italic accent">includes.</span>
          </h2>

          <div className="workshop-included__grid">
            {INCLUDED.map((c) => (
              <article className="fcard" key={c.n}>
                <div className="fcard__head">
                  <span className="fcard__n mono">{c.n}</span>
                  <span className="fcard__dot mono">·</span>
                  <span className="fcard__label mono accent">{c.label}</span>
                </div>
                <h3 className="fcard__title">{c.title}</h3>
                <p className="fcard__body">{c.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── § 04 Description (optional) ──────────────────────────────────── */}
      {workshop.description && (
        <section className="section-pad section--inset">
          <div className="container container--narrow">
            <div className="kicker">§ 04 · About this session</div>
            <h2 className="workshop-details__head">
              About <span className="italic accent">this session.</span>
            </h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: 1.7,
                color: 'var(--ink)',
                whiteSpace: 'pre-line',
                margin: 0,
                maxWidth: '64ch',
              }}
            >
              {workshop.description}
            </p>
          </div>
        </section>
      )}

      {/* ── Already registered? ──────────────────────────────────────────── */}
      <section className="workshop-existing">
        <div className="container">
          <p>Already registered?</p>
          <Link to="/login" className="arrow-link">Log in to your portal →</Link>
        </div>
      </section>
    </div>
  )
}
