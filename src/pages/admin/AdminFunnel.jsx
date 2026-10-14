import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEnrollment } from '../../hooks/useEnrollment'
import AdminNav from '../../components/admin/AdminNav'
import DateRangeSelect from '../../components/admin/analytics/DateRangeSelect'
import FunnelStep from '../../components/admin/funnel/FunnelStep'
import SourcesSection from '../../components/admin/funnel/SourcesSection'
import { useFunnelData } from '../../components/admin/funnel/useFunnelData'
import {
  CoreDetail,
  LeadsDetail,
  NurtureDetail,
  OfferDetail,
  RepeatDetail,
  TrafficDetail,
} from '../../components/admin/funnel/StepDetails'
import { BAD, Note, SoftErrors } from '../../components/admin/analytics/primitives'
import { DEFAULT_RANGE, isDateRange } from '../../components/admin/analytics/shared'
import { funnelSteps } from '../../lib/funnelSteps'

/**
 * /admin/funnel, Phase 2 of docs/admin-analytics-engine-plan.md.
 *
 * A six-step period funnel: each step counts what happened inside the window.
 * Steps 4 to 6 are standalone (src/lib/funnelSteps.js) and are never divided
 * by the step above.
 *
 * Two requests: /api/admin/funnel (our tables and Kit) and
 * /api/admin/funnel-traffic (PostHog). Each fails on its own and its panels
 * render a dash with the reason. Responses are cached per range and product;
 * stale numbers stay on screen, dimmed, while a new selection loads.
 */
const ALL = 'all'

export default function AdminFunnel() {
  const { user, signOut } = useEnrollment()

  const [range, setRange] = useState(() => {
    try {
      const saved = window.localStorage.getItem('pp.admin.range')
      return isDateRange(saved) ? saved : DEFAULT_RANGE
    } catch {
      return DEFAULT_RANGE
    }
  })
  const [product, setProduct] = useState(ALL)

  function changeRange(next) {
    setRange(next)
    try {
      window.localStorage.setItem('pp.admin.range', next)
    } catch {
      // Per-browser convenience only.
    }
  }

  const funnel = useFunnelData(`/api/admin/funnel?range=${encodeURIComponent(range)}&product=${encodeURIComponent(product)}`)
  const traffic = useFunnelData(`/api/admin/funnel-traffic?range=${encodeURIComponent(range)}`)

  const products = funnel.data?.products ?? []
  const productLabel = product === ALL ? 'any product' : products.find((p) => p.slug === product)?.title ?? product
  const steps = useMemo(() => funnelSteps(funnel.data, traffic.data, { productLabel }), [funnel.data, traffic.data, productLabel])

  const errors = useMemo(() => ({ ...(funnel.data?.errors ?? {}), ...(traffic.data?.errors ?? {}) }), [funnel.data, traffic.data])
  const dimmed = funnel.loading || funnel.stale

  const details = {
    traffic: <TrafficDetail traffic={traffic.data?.traffic} errors={errors} loading={traffic.loading} />,
    leads: <LeadsDetail leads={funnel.data?.leads} preLead={traffic.data?.pre_lead} errors={errors} trafficLoading={traffic.loading} />,
    nurture: <NurtureDetail nurture={funnel.data?.nurture} errors={errors} />,
    offer: <OfferDetail offer={funnel.data?.offer} expiringSoon={funnel.data?.offers_expiring_soon} errors={errors} />,
    core: <CoreDetail core={funnel.data?.core} errors={errors} />,
    repeat: <RepeatDetail repeat={funnel.data?.repeat} errors={errors} />,
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <p className="pp-eyebrow" style={{ marginBottom: '0.5rem' }}>
              Admin
            </p>
            <h1 className="pp-page-title">Funnel</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <DateRangeSelect value={range} onChange={changeRange} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
              <span className="pp-section-label" style={{ fontSize: '0.6rem' }}>
                Steps 5 and 6
              </span>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-rule)',
                  borderRadius: 4,
                  padding: '0.4rem 0.6rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                }}
              >
                <option value={ALL}>All products</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {funnel.error && !funnel.data ? <p style={{ color: BAD, fontSize: '0.85rem' }}>{funnel.error}</p> : null}
        {traffic.error && !traffic.data ? <p style={{ color: BAD, fontSize: '0.85rem' }}>PostHog request failed: {traffic.error}</p> : null}
        {!funnel.data && !funnel.error ? <Note style={{ margin: '0 0 1.5rem' }}>Loading…</Note> : null}
        <SoftErrors errors={errors} />

        <div style={{ opacity: dimmed ? 0.55 : 1, transition: 'opacity 0.15s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '3rem' }}>
            {steps.map((step) => (
              <FunnelStep key={step.key} index={step.index} label={step.label} value={step.value} comparison={step.comparison} caption={step.caption}>
                {details[step.key]}
              </FunnelStep>
            ))}
          </div>

          <SourcesSection sources={funnel.data?.sources ?? null} errors={errors} />

          <Note>
            Period funnel: every step counts events inside the selected window (UTC days), so a buyer here was usually a lead in an
            earlier window. Rates between steps 1 to 3 are shown; steps 4 to 6 carry their own denominators. Email engine detail is on{' '}
            <Link to="/admin/kit" style={{ color: 'var(--color-accent)' }}>
              Kit
            </Link>
            , revenue on{' '}
            <Link to="/admin/analytics" style={{ color: 'var(--color-accent)' }}>
              Analytics
            </Link>
            .
          </Note>
        </div>
      </main>
    </div>
  )
}
