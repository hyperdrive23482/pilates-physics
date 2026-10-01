import { useCallback, useEffect, useState } from 'react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import StatCard from '../../components/admin/StatCard'

const WARN = '#e0a458'
const BAD = '#ff7d7d'

// Kit reports rates as percentages already (71.3, not 0.713).
function pct(v) {
  return v == null ? 'n/a' : `${Number(v).toFixed(1)}%`
}

function ratio(part, whole) {
  return whole ? `${Math.round((part / whole) * 100)}%` : 'n/a'
}

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'n/a'
}

export default function AdminKit() {
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(
    (refresh = false) => {
      setLoading(true)
      setError(null)
      request(`/api/admin/kit/metrics${refresh ? '?refresh=1' : ''}`)
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false))
    },
    [request],
  )

  useEffect(() => {
    load()
  }, [load])

  const errors = data?.errors ?? {}

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            margin: '0 0 2rem',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Kit
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {data && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                Updated {new Date(data.fetched_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
            <button type="button" className="pp-btn" onClick={() => load(true)} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && <p style={{ color: BAD, fontSize: '0.85rem' }}>{error}</p>}
        {!data && !error && (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        )}

        {data && (
          <>
            <CartHealth health={data.cart_health} error={errors.funnel} />
            <ListHealth list={data.list} error={errors.list} />
            {data.sequences?.funnels?.map((f) => (
              <SequenceFunnel key={f.name ?? f.label} funnel={f} />
            ))}
            {errors.sequences && <SectionError>{errors.sequences}</SectionError>}
            <Offers offers={data.offers} error={errors.offers} />
            <TagCounts rows={data.tag_counts} error={errors.tag_counts} />
            <AllSequences rows={data.sequences?.summary} />
            <Broadcasts rows={data.broadcasts} error={errors.broadcasts} />
          </>
        )}
      </main>
    </div>
  )
}

// The checks that would have caught the dead $39 links in September 2026.
function CartHealth({ health, error }) {
  if (error) return <SectionError>{error}</SectionError>
  if (!health) return null

  const alerts = []
  if (health.in_cart_without_token > 0) {
    alerts.push({
      color: BAD,
      text: `${health.in_cart_without_token} of ${health.in_cart_now} people in the cart sequence right now have no offer token. Their $39 links are blank and land on the recovery form.`,
    })
  }
  if (!health.mint_enabled) {
    alerts.push({
      color: WARN,
      text: 'Offer minting is off in this environment (MINT_OFFERS_ENABLED is not "true"), so the cron is a dry run.',
    })
  }
  if (health.stale_cart_tag > 0) {
    alerts.push({
      color: WARN,
      text: `${health.stale_cart_tag} people finished the cart sequence but still carry in-HARW-sequence. The "HARW Email Sequence" automation is not removing it, and minting would open windows for them that no email will ever mention.`,
    })
  }
  if (!alerts.length) return null

  return (
    <section style={{ marginBottom: '3rem', display: 'grid', gap: '0.75rem' }}>
      {alerts.map((a) => (
        <p
          key={a.text}
          style={{
            margin: 0,
            padding: '0.85rem 1rem',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: 'var(--color-ink)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-rule)',
            borderLeft: `3px solid ${a.color}`,
          }}
        >
          {a.text}
        </p>
      ))}
    </section>
  )
}

function ListHealth({ list, error }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>List</SectionHeading>
      {error ? (
        <SectionError>{error}</SectionError>
      ) : (
        list && (
          <CardGrid>
            <StatCard label="Subscribers" value={list.subscribers ?? 'n/a'} />
            <StatCard label="New, last 30 days" value={list.new_30d ?? 'n/a'} sublabel={`${list.net_new_30d ?? 0} net`} />
            <StatCard label="Unsubscribed, last 30 days" value={list.cancellations_30d ?? 'n/a'} />
            <StatCard label="Open rate, 90 days" value={pct(list.email_90d?.open_rate)} sublabel={`${list.email_90d?.sent ?? 0} emails sent`} />
            <StatCard label="Click rate, 90 days" value={pct(list.email_90d?.click_rate)} />
          </CardGrid>
        )
      )}
    </section>
  )
}

function SequenceFunnel({ funnel: f }) {
  if (f.missing) {
    return (
      <section style={{ marginBottom: '3rem' }}>
        <SectionHeading>{f.label}</SectionHeading>
        <SectionError>No Kit sequence is named &ldquo;{f.name}&rdquo;.</SectionError>
      </section>
    )
  }

  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>
        {f.label} sequence
        {f.label !== f.name ? ` (${f.name})` : ''}
      </SectionHeading>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: '-0.5rem 0 1rem' }}>
        Entries {fmtDate(f.first_added_at)} to {fmtDate(f.last_added_at)}. A purchase counts here only if it came after
        the person entered the sequence.
      </p>

      <CardGrid>
        <StatCard label="Entered" value={f.entered} />
        <StatCard label="In it now" value={f.in_progress} />
        <StatCard label="Finished, did not buy" value={f.finished_without_buying} />
        <StatCard label="Bought" value={f.bought} sublabel={`${ratio(f.bought, f.entered)} of entries`} />
        <StatCard label="Unsubscribed" value={f.unsubscribed} sublabel={`${ratio(f.unsubscribed, f.entered)} of entries`} />
        {f.offer && (
          <StatCard
            label="Had an offer token"
            value={f.with_offer_token}
            sublabel={`${ratio(f.with_offer_token, f.entered)} of entries`}
          />
        )}
      </CardGrid>

      <Table
        head={[
          ['#'],
          ['Subject'],
          ['Delay'],
          ['Sent', 'right'],
          ['Open', 'right'],
          ['Click', 'right'],
          ['Unsub', 'right'],
        ]}
      >
        {f.emails.map((e, i) => (
          <tr key={e.id} style={{ borderBottom: '1px solid var(--color-rule)', opacity: e.published ? 1 : 0.55 }}>
            {/* Kit numbers from 0; the site numbers from 01. */}
            <Td mono>{String(i + 1).padStart(2, '0')}</Td>
            <Td>
              {e.subject}
              {!e.published && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: WARN }}>draft, not sending</span>
              )}
            </Td>
            <Td mono>{e.delay ?? 'n/a'}</Td>
            <Td align="right" mono>{e.recipients}</Td>
            <Td align="right" mono>{e.recipients ? pct(e.open_rate) : 'n/a'}</Td>
            <Td align="right" mono>{e.recipients ? `${pct(e.click_rate)} (${e.clicks})` : 'n/a'}</Td>
            <Td align="right" mono>{e.recipients ? pct(e.unsubscribe_rate) : 'n/a'}</Td>
          </tr>
        ))}
      </Table>
    </section>
  )
}

function Offers({ offers, error }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>$39 offers</SectionHeading>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: '-0.5rem 0 1rem' }}>
        From this environment&rsquo;s database, so only production shows real numbers. &ldquo;Opened page&rdquo; is the
        first load of the offer link.
      </p>
      {error ? (
        <SectionError>{error}</SectionError>
      ) : offers?.length ? (
        <Table
          head={[
            ['Campaign'],
            ['Minted', 'right'],
            ['Sent to Kit', 'right'],
            ['Opened page', 'right'],
            ['Bought', 'right'],
            ['Still live', 'right'],
            ['Expired unused', 'right'],
            ['Forwarded', 'right'],
          ]}
        >
          {offers.map((o) => (
            <tr key={o.offer_key} style={{ borderBottom: '1px solid var(--color-rule)' }}>
              <Td mono>{o.offer_key}</Td>
              <Td align="right" mono>{o.minted}</Td>
              <Td align="right" mono>{o.kit_synced}</Td>
              <Td align="right" mono>{o.seen} ({ratio(o.seen, o.minted)})</Td>
              <Td align="right" mono>{o.redeemed} ({ratio(o.redeemed, o.minted)})</Td>
              <Td align="right" mono>{o.live}</Td>
              <Td align="right" mono>{o.expired_unused}</Td>
              <Td align="right" mono>{o.forwarded}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>No offers minted yet.</Empty>
      )}
    </section>
  )
}

function TagCounts({ rows, error }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>Funnel tags</SectionHeading>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-ink-muted)', margin: '-0.5rem 0 1rem' }}>
        Active subscribers holding each tag. These are applied by the Kit automations, so a number that disagrees with
        the sequence counts above points at a broken automation step.
      </p>
      {error ? (
        <SectionError>{error}</SectionError>
      ) : (
        rows && (
          <Table head={[['Stage'], ['Tag'], ['People', 'right']]}>
            {rows.map((r) => (
              <tr key={r.tag} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                <Td>{r.label}</Td>
                <Td mono>{r.tag}</Td>
                <Td align="right" mono>{r.missing ? 'tag missing' : r.count}</Td>
              </tr>
            ))}
          </Table>
        )
      )}
    </section>
  )
}

function AllSequences({ rows }) {
  if (!rows?.length) return null
  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>All sequences</SectionHeading>
      <Table
        head={[
          ['Sequence'],
          ['Emails', 'right'],
          ['In it now', 'right'],
          ['Sent', 'right'],
          ['Open', 'right'],
          ['Click', 'right'],
        ]}
      >
        {rows.map((s) => (
          <tr key={s.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
            <Td>{s.name}</Td>
            <Td align="right" mono>{s.email_count}</Td>
            <Td align="right" mono>{s.in_progress}</Td>
            <Td align="right" mono>{s.recipients ?? 'n/a'}</Td>
            <Td align="right" mono>{pct(s.open_rate)}</Td>
            <Td align="right" mono>{pct(s.click_rate)}</Td>
          </tr>
        ))}
      </Table>
    </section>
  )
}

function Broadcasts({ rows, error }) {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <SectionHeading>Broadcasts</SectionHeading>
      {error ? (
        <SectionError>{error}</SectionError>
      ) : rows?.length ? (
        <Table
          head={[
            ['Subject'],
            ['Sent'],
            ['Recipients', 'right'],
            ['Open', 'right'],
            ['Click', 'right'],
            ['Unsubs', 'right'],
          ]}
        >
          {rows.map((b) => (
            <tr key={b.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
              <Td>{b.subject}</Td>
              <Td mono>{fmtDate(b.send_at)}</Td>
              <Td align="right" mono>{b.recipients}</Td>
              <Td align="right" mono>{pct(b.open_rate)}</Td>
              <Td align="right" mono>{pct(b.click_rate)}</Td>
              <Td align="right" mono>{b.unsubscribes}</Td>
            </tr>
          ))}
        </Table>
      ) : (
        <Empty>No sent broadcasts.</Empty>
      )}
    </section>
  )
}

function CardGrid({ children }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}
    >
      {children}
    </div>
  )
}

function Table({ head, children }) {
  return (
    <div className="pp-table-wrap" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-rule)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-rule)' }}>
            {head.map(([label, align]) => (
              <Th key={label} align={align}>
                {label}
              </Th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '1rem',
      }}
    >
      {children}
    </h2>
  )
}

function SectionError({ children }) {
  return <p style={{ color: BAD, fontSize: '0.85rem', margin: '0 0 1rem' }}>{children}</p>
}

function Empty({ children }) {
  return <p style={{ fontSize: '0.85rem', color: 'var(--color-ink-muted)', margin: 0 }}>{children}</p>
}

function Th({ children, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '0.75rem 1rem',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left', mono }) {
  return (
    <td
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
        color: 'var(--color-ink)',
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : undefined,
        fontSize: mono ? '0.8rem' : undefined,
      }}
    >
      {children}
    </td>
  )
}
