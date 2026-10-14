import { Fragment, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import TabFrame from '../TabFrame'
import { useTabData } from '../useTabData'
import { EmptyPanel, Fraction, Kind, Note, Row, Section, Table, Td } from '../primitives'
import { NO_VALUE, formatCents, formatCount, formatDateTime } from '../shared'

const GRANT_LABELS = {
  manual: 'Manual',
  admin: 'Admin',
  kit_tag: 'Kit tag',
  bonus: 'Bonus',
  bundle: 'Bundle',
  lead_magnet: 'Calculator lead',
}

export default function ProductsTab({ range }) {
  const { data, error, loading, stale } = useTabData('products', range)
  const [open, setOpen] = useState(null)
  const products = data?.products ?? []
  const engagementMissing = Boolean(data?.errors?.engagement)
  const ledgerMissing = Boolean(data?.errors?.purchases)

  return (
    <TabFrame data={data} error={error} loading={loading} stale={stale} errors={data?.errors}>
      <Section
        title="Workshops and courses"
        note="Enrollments and reach are all time. Orders and net respect the range. Click a row for its content."
      >
        {products.length === 0 ? (
          <EmptyPanel>No workshops or courses yet.</EmptyPanel>
        ) : (
          <Table
            minWidth={960}
            head={[
              ['Product'],
              ['Paid', 'right', 'Entitlements granted by a Stripe purchase'],
              ['Granted', 'right', 'Entitlements granted without a purchase'],
              ['Orders', 'right', 'Ledger orders in the selected range'],
              ['Net', 'right', 'Net revenue in the selected range'],
              ['Opened portal', 'right', 'Enrolled people who opened the portal at least once'],
              ['Certificates', 'right', 'Enrolled people who downloaded a certificate'],
              ['NPS', 'right', 'Average score and responses from the post-workshop survey'],
              ['Open Qs', 'right', 'Unanswered pre-workshop questions'],
            ]}
          >
            {products.map((p) => {
              const isOpen = open === p.id
              const Chevron = isOpen ? ChevronDown : ChevronRight
              return (
                <Fragment key={p.id}>
                  <Row onClick={() => setOpen(isOpen ? null : p.id)} open={isOpen}>
                    <Td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Chevron size={14} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
                        <span>
                          {p.title}
                          <Kind kind={p.kind} />
                        </span>
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-ink-dim)', marginLeft: '1.3rem' }}>
                        {p.status}
                        {p.scheduled_at ? ` · ${formatDateTime(p.scheduled_at)}` : ''}
                        {` · ${formatCount(p.enrolled)} enrolled`}
                      </div>
                    </Td>
                    <Td align="right" mono>
                      {formatCount(p.paid)}
                      {p.scholarship ? (
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-dim)' }}>{p.scholarship} scholarship</div>
                      ) : null}
                    </Td>
                    <Td align="right" mono>
                      {formatCount(p.granted_total)}
                    </Td>
                    <Td align="right" mono muted={ledgerMissing}>
                      {formatCount(p.orders_in_range)}
                    </Td>
                    <Td align="right" mono muted={ledgerMissing}>
                      {formatCents(p.net_cents_in_range)}
                    </Td>
                    <Td align="right" mono muted={engagementMissing}>
                      <Fraction value={p.portal_viewers} />
                    </Td>
                    <Td align="right" mono muted={engagementMissing}>
                      {p.certificates ? <Fraction value={p.certificates.people} /> : NO_VALUE}
                    </Td>
                    <Td align="right" mono>
                      {p.nps ? (
                        <>
                          {p.nps.avg}
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-dim)' }}>
                            {p.nps.count} response{p.nps.count === 1 ? '' : 's'} · NPS {p.nps.score}
                          </div>
                        </>
                      ) : (
                        NO_VALUE
                      )}
                    </Td>
                    <Td align="right" mono muted={p.unanswered_questions === 0}>
                      {formatCount(p.unanswered_questions)}
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-ink-dim)' }}>of {formatCount(p.questions)}</div>
                    </Td>
                  </Row>
                  {isOpen ? (
                    <tr style={{ borderBottom: '1px solid var(--color-rule)', background: 'rgba(227, 227, 227, 0.02)' }}>
                      <Td colSpan={9} style={{ padding: '1rem 1rem 1.25rem 2.3rem' }}>
                        <ProductDetail product={p} engagementMissing={engagementMissing} />
                      </Td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </Table>
        )}
        <Note>
          Paid counts entitlements granted through Stripe, scholarships included. Granted counts every other
          source: {Object.values(GRANT_LABELS).join(', ').toLowerCase()}. Reach columns come from the activity
          log, which began in August 2026, so earlier cohorts read low.
        </Note>
      </Section>
    </TabFrame>
  )
}

function ProductDetail({ product: p, engagementMissing }) {
  const grants = Object.entries(p.granted).filter(([, n]) => n > 0)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(320px, 2fr)', gap: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <Label>Granted by source</Label>
          {grants.length === 0 ? (
            <Small>No non-purchase grants.</Small>
          ) : (
            grants.map(([src, n]) => (
              <div key={src} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--color-ink)' }}>{GRANT_LABELS[src] ?? src}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>
                  {formatCount(n)}
                </span>
              </div>
            ))
          )}
        </div>
        <div>
          <Label>Reach</Label>
          <Line label="Opened the portal" value={<Fraction value={p.portal_viewers} />} />
          <Line
            label="Opened a recording"
            value={p.recording_watchers ? <Fraction value={p.recording_watchers} /> : NO_VALUE}
          />
          <Line
            label="Certificate downloads"
            value={p.certificates ? `${formatCount(p.certificates.downloads)} by ${formatCount(p.certificates.people.n)}` : NO_VALUE}
          />
          <Line label="All-time orders" value={formatCount(p.orders_all_time)} />
          <Line label="All-time net" value={formatCents(p.net_cents_all_time)} />
        </div>
        {p.nps ? (
          <div>
            <Label>Survey</Label>
            <Line label="Average score" value={`${p.nps.avg} of 10`} />
            <Line label="Promoters (9 to 10)" value={<Fraction value={{ n: p.nps.promoters, m: p.nps.count }} />} />
            <Line label="Detractors (1 to 6)" value={<Fraction value={{ n: p.nps.detractors, m: p.nps.count }} />} />
          </div>
        ) : null}
      </div>
      <div>
        <Label>Content, ranked by distinct openers</Label>
        {engagementMissing ? (
          <Small>The engagement view (migration 063) is missing, so opens cannot be counted.</Small>
        ) : p.content.length === 0 ? (
          <Small>No content items.</Small>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <tbody>
              {p.content.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-rule)' }}>
                  <td style={{ padding: '0.4rem 0', color: c.removed ? 'var(--color-ink-muted)' : 'var(--color-ink)' }}>
                    {c.title}
                    {c.type ? <Kind kind={c.type.replace('_', ' ')} /> : <Kind kind="removed" />}
                  </td>
                  <td style={{ padding: '0.4rem 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                    <Fraction value={{ n: c.distinct_users, m: p.enrolled }} />
                  </td>
                  <td style={{ padding: '0.4rem 0 0.4rem 1rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink-dim)', whiteSpace: 'nowrap' }}>
                    {formatCount(c.opens)} open{c.opens === 1 ? '' : 's'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Label({ children }) {
  return (
    <p
      style={{
        margin: '0 0 0.4rem',
        fontSize: '0.62rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
      }}
    >
      {children}
    </p>
  )
}

function Line({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.82rem' }}>
      <span style={{ color: 'var(--color-ink)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-ink-muted)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function Small({ children }) {
  return <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-ink-muted)' }}>{children}</p>
}
