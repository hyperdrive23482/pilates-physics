import { Link } from 'react-router-dom'
import BreakdownTable from '../analytics/BreakdownTable'
import BarsCard from '../analytics/BarsCard'
import { Note, Row, Table, Td } from '../analytics/primitives'
import { NO_VALUE, formatCount, formatDays, formatFraction } from '../analytics/shared'
import { DetailUnavailable, Snapshot } from './FunnelStep'

/**
 * The expandable body of each funnel step. One component per step, each
 * taking its own block of the API response plus the `errors` map, so a block
 * that did not arrive explains itself in place of its numbers.
 */

const linkStyle = { color: 'var(--color-accent)' }

function pct(v) {
  return v == null ? NO_VALUE : `${Number(v).toFixed(1)}%`
}

function Grid({ children, min = 220 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: '1.5rem', marginTop: '1.25rem' }}>
      {children}
    </div>
  )
}

function Snapshots({ children }) {
  return <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>{children}</div>
}

function Fraction({ value }) {
  if (!value || typeof value.m !== 'number') return NO_VALUE
  return formatFraction(value.n, value.m)
}

function reasonFor(errors, keys, fallback) {
  for (const k of keys) if (errors?.[k]) return `${fallback} (${errors[k]})`
  return fallback
}

// ─── 1. Web traffic ─────────────────────────────────────────────────────────

export function TrafficDetail({ traffic, errors, loading }) {
  if (!traffic) {
    return (
      <DetailUnavailable
        reason={loading ? 'Loading from PostHog…' : reasonFor(errors, ['posthog', 'traffic'], 'PostHog traffic is not available.')}
      />
    )
  }
  const perVisit = traffic.visits > 0 ? Math.round((traffic.pageviews / traffic.visits) * 10) / 10 : null
  return (
    <div>
      <Snapshots>
        <Snapshot label="Visits" value={formatCount(traffic.visits)} />
        <Snapshot label="Pageviews" value={formatCount(traffic.pageviews)} />
        <Snapshot label="Pages per visit" value={perVisit === null ? NO_VALUE : perVisit} />
      </Snapshots>
      <Grid>
        <BreakdownTable title="Channel" rows={traffic.channels} valueLabel="visits" empty="No sessions in this window." />
        <BreakdownTable title="Top referrers" rows={traffic.referrers} valueLabel="visits" empty="No sessions in this window." />
        <BreakdownTable title="Campaigns" rows={traffic.campaigns} valueLabel="visits" empty="No UTM-tagged sessions in this window." />
        <BreakdownTable title="Country" rows={traffic.countries} empty="No visitors in this window." />
        <BreakdownTable title="US state" rows={traffic.us_states} empty="No US visitors in this window." />
      </Grid>
      <Note>
        Content pages only, on the production host. PostHog Web Analytics shows a larger number because it also counts the portal,
        the admin and stage. Channels, referrers and campaigns are by where each visit entered.
      </Note>
    </div>
  )
}

// ─── 2. Calculator leads ────────────────────────────────────────────────────

export function LeadsDetail({ leads, preLead, errors, trafficLoading }) {
  if (!leads) return <DetailUnavailable reason="Lead counts did not load." />
  const unseen = preLead && typeof leads.count === 'number' ? Math.max(0, leads.count - preLead.measured) : null
  return (
    <div>
      <Snapshots>
        <Snapshot label="Calculator claims" value={formatCount(leads.count)} />
        <Snapshot
          label="New Kit subscribers"
          value={formatCount(leads.kit_new)}
          hint={
            leads.kit_new === null
              ? reasonFor(errors, ['kit_subscribers', 'kit'], 'Kit not read')
              : `${formatCount(leads.kit_overlap)} also claimed · ${formatCount(leads.kit_only)} from other forms`
          }
        />
        <Snapshot label="With an attribution record" value={<Fraction value={leads.measured} />} />
      </Snapshots>

      {leads.sources ? (
        <Grid>
          <BreakdownTable title="First touch" rows={leads.sources.first_touch} empty="No leads in this window." />
          <BreakdownTable title="Last touch" rows={leads.sources.last_touch} empty="No leads in this window." />
          <BreakdownTable title="Campaigns" rows={leads.sources.campaigns} empty="No campaign-tagged leads in this window." />
          <BreakdownTable title="First landing page" rows={leads.sources.landing_paths} empty="No landing pages recorded for these leads." />
        </Grid>
      ) : (
        <Note tone="warn">{reasonFor(errors, ['attribution'], 'touch_attribution is not available, so sources cannot be shown.')}</Note>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontFamily: 'var(--font-serif)', fontSize: '0.95rem', color: 'var(--color-ink)' }}>
          Before they claimed
        </p>
        {preLead ? (
          <>
            <Snapshots>
              <Snapshot
                label="Measured in PostHog"
                value={formatCount(preLead.measured)}
                hint={unseen === null ? undefined : `${formatCount(unseen)} unseen (blocked script, another device, or older than PostHog)`}
              />
              <Snapshot label="Content pages first" value={`${preLead.pages.median} median`} hint={`${preLead.pages.mean} mean`} />
              <Snapshot label="Visits first" value={`${preLead.visits.median} median`} hint={`${preLead.visits.mean} mean`} />
              <Snapshot
                label="Calculator page conversion"
                value={formatFraction(preLead.landing_claimed, preLead.landing_visitors)}
                hint="People who viewed /spring-calculator in this window, and how many of them claimed"
              />
            </Snapshots>
            <Grid>
              <BreakdownTable title="What they read first" rows={preLead.top_pages} valueLabel="people" empty="No content pageviews before any claim." />
            </Grid>
          </>
        ) : (
          <DetailUnavailable
            reason={trafficLoading ? 'Loading from PostHog…' : reasonFor(errors, ['posthog', 'pre_lead'], 'PostHog is not available.')}
          />
        )}
      </div>
      <Note>
        Kit sees everyone who filled a form; our database only sees calculator claims. The two are reported side by side with their
        overlap, never added.
      </Note>
    </div>
  )
}

// ─── 3. Entered the offer window ────────────────────────────────────────────

export function NurtureDetail({ nurture, errors }) {
  if (!nurture) return <DetailUnavailable reason="Offer window counts did not load." />
  return (
    <div>
      <Snapshots>
        <Snapshot label="Offers minted" value={formatCount(nurture.minted)} hint={nurture.minted === null ? reasonFor(errors, ['offers'], 'subscriber_offers not read') : undefined} />
        <Snapshot
          label="Tagged in-HARW-sequence"
          value={formatCount(nurture.tagged)}
          hint={nurture.tagged === null ? reasonFor(errors, ['kit_tag', 'kit'], 'Kit not read') : `${formatCount(nurture.overlap)} of them also minted`}
        />
        <Snapshot
          label="Claim to offer"
          value={formatDays(nurture.claim_to_mint_days)}
          hint={nurture.claim_to_mint_measured ? `median, measured for ${formatFraction(nurture.claim_to_mint_measured.n, nurture.claim_to_mint_measured.m)} minted` : undefined}
        />
        <Snapshot
          label="Unsubscribed during nurture"
          value={nurture.nurture_unsubscribed === null ? NO_VALUE : formatFraction(nurture.nurture_unsubscribed, nurture.nurture_entered)}
          hint="All time, from Kit"
        />
      </Snapshots>

      <div style={{ marginTop: '1.25rem' }}>
        {nurture.emails ? (
          nurture.emails.length ? (
            <Table minWidth={560} head={[['#'], ['Nurture email'], ['Sent', 'right'], ['Opened', 'right'], ['Clicked', 'right'], ['Unsubscribed', 'right']]}>
              {nurture.emails.map((e) => (
                <Row key={`${e.position}-${e.subject}`}>
                  <Td mono muted>{e.position}</Td>
                  <Td>{e.subject}</Td>
                  <Td align="right" mono>{formatCount(e.recipients)}</Td>
                  <Td align="right" mono>{e.recipients ? pct(e.open_rate) : NO_VALUE}</Td>
                  <Td align="right" mono>{e.recipients ? pct(e.click_rate) : NO_VALUE}</Td>
                  <Td align="right" mono>{e.recipients ? pct(e.unsubscribe_rate) : NO_VALUE}</Td>
                </Row>
              ))}
            </Table>
          ) : (
            <Note>The nurture sequence has no emails with stats yet.</Note>
          )
        ) : (
          <Note tone="warn">{reasonFor(errors, ['kit_nurture', 'kit'], 'Nurture email rates are not available.')}</Note>
        )}
      </div>
      <Note>
        Email rates are Kit&apos;s all-time figures for the sequence, not this window. Tag and sequence detail lives on{' '}
        <Link to="/admin/kit" style={linkStyle}>
          Kit
        </Link>
        .
      </Note>
    </div>
  )
}

// ─── 4. Bought the $39 course ───────────────────────────────────────────────

export function OfferDetail({ offer, expiringSoon, errors }) {
  if (!offer) return <DetailUnavailable reason="Offer counts did not load." />
  if (!offer.stages) {
    return <DetailUnavailable reason={reasonFor(errors, ['offers'], 'subscriber_offers is not available.')} />
  }
  const s = offer.stages
  return (
    <div>
      <Snapshots>
        <Snapshot label="Minted" value={formatCount(s.minted)} hint="Offers created in this window" />
        <Snapshot label="Seen" value={formatFraction(s.seen, s.minted)} hint="Opened the offer page" />
        <Snapshot label="Redeemed" value={formatFraction(s.redeemed, s.minted)} />
        <Snapshot label="Forwarded" value={formatCount(s.forwarded)} hint="Redeemed by a different address" />
        <Snapshot label="Expired unused, then full price" value={<Fraction value={offer.expired_then_full} />} hint="Of offers that closed in this window" />
        <Snapshot label="Live right now" value={formatCount(expiringSoon)} hint="Unredeemed offers still inside their window" />
      </Snapshots>
      <Grid min={280}>
        <BarsCard
          title="Redeemed on which day"
          subtitle="Of the four day window, for offers minted in this window"
          data={offer.by_day}
          height={160}
          emptyText="No redemptions in this window."
        />
        <div>
          {offer.by_week?.length ? (
            <Table minWidth={320} head={[['Week of'], ['Minted', 'right'], ['Seen', 'right'], ['Redeemed', 'right']]}>
              {offer.by_week.map((w) => (
                <Row key={w.week}>
                  <Td mono>{w.week}</Td>
                  <Td align="right" mono>{formatCount(w.minted)}</Td>
                  <Td align="right" mono>{formatCount(w.seen)}</Td>
                  <Td align="right" mono>{formatCount(w.redeemed)}</Td>
                </Row>
              ))}
            </Table>
          ) : (
            <Note>No offers minted in this window.</Note>
          )}
        </div>
      </Grid>
      <Note>
        The headline is orders at the offer price. The rate beside it is the honest one for a timed offer: of the windows that
        closed in this range, how many were redeemed. Minting and the offer emails are on{' '}
        <Link to="/admin/kit" style={linkStyle}>
          Kit
        </Link>
        .
      </Note>
    </div>
  )
}

// ─── 5. Bought a core workshop ──────────────────────────────────────────────

export function CoreDetail({ core, errors }) {
  if (!core) return <DetailUnavailable reason="Core order counts did not load." />
  if (core.count === null) return <DetailUnavailable reason={reasonFor(errors, ['purchases'], 'The purchases ledger is not available.')} />
  return (
    <div>
      <Snapshots>
        <Snapshot label="Were a lead first" value={<Fraction value={core.was_lead} />} hint={core.lead_to_purchase_days === null ? undefined : `median ${formatDays(core.lead_to_purchase_days)} from claim to order`} />
        <Snapshot
          label="First touch to order"
          value={formatDays(core.first_touch_days)}
          hint={core.first_touch_measured ? `median, measured for ${formatFraction(core.first_touch_measured.n, core.first_touch_measured.m)}` : undefined}
        />
        <Snapshot label="Scholarships granted" value={formatCount(core.scholarships)} hint="Not counted in the headline" />
      </Snapshots>
      <Grid>
        <BreakdownTable title="By product" rows={core.by_product} empty="No core orders in this window." />
        <BreakdownTable title="By pricing" rows={core.by_pricing} empty="No core orders in this window." />
        <BreakdownTable title="By what came first" rows={core.by_prior_status} empty="No core orders in this window." />
        {core.by_first_touch ? (
          <BreakdownTable title="By first touch" rows={core.by_first_touch} empty="No core orders in this window." />
        ) : (
          <Note tone="warn">{reasonFor(errors, ['attribution'], 'touch_attribution is not available.')}</Note>
        )}
      </Grid>
      <Note>
        Launch timing, early bird versus full price by day and revenue are on the{' '}
        <Link to="/admin/analytics?tab=revenue" style={linkStyle}>
          Revenue tab
        </Link>
        .
      </Note>
    </div>
  )
}

// ─── 6. Bought again ────────────────────────────────────────────────────────

export function RepeatDetail({ repeat, errors }) {
  if (!repeat) return <DetailUnavailable reason="Repeat counts did not load." />
  if (repeat.count === null) return <DetailUnavailable reason={reasonFor(errors, ['purchases'], 'The purchases ledger is not available.')} />
  return (
    <div>
      <Snapshots>
        <Snapshot label="Between orders" value={formatDays(repeat.days_between)} hint="Median, previous order to this one" />
        <Snapshot label="Bought twice or more" value={<Fraction value={repeat.twice_share} />} hint="All buyers, all time" />
      </Snapshots>
      <Grid>
        <BreakdownTable title="Previous product, then this one" rows={repeat.matrix} valueLabel="orders" empty="No repeat orders in this window." />
      </Grid>
    </div>
  )
}
