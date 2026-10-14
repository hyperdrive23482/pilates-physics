import { Note, Row, Section, Table, Td } from '../analytics/primitives'
import { formatCount } from '../analytics/shared'

/**
 * Conversion tables by first touch, last touch and campaign: leads, $39
 * buyers and core buyers per source for the window. Only counts leave the
 * server; there are no ids or emails behind these rows.
 */
export default function SourcesSection({ sources, errors }) {
  return (
    <Section title="Sources" note="Where this window's leads and buyers first came from, bucketed the same way as the Audience tab.">
      {sources ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <SourceTable title="First touch" rows={sources.first_touch} />
          <SourceTable title="Last touch" rows={sources.last_touch} />
          <SourceTable title="Campaign" rows={sources.campaigns} />
        </div>
      ) : (
        <Note tone="warn" style={{ margin: 0 }}>
          {errors?.attribution
            ? `touch_attribution is not available (${errors.attribution}).`
            : 'touch_attribution is not available, so sources cannot be shown.'}
        </Note>
      )}
      <Note>
        Attribution is first-party and exists only for accounts created after it shipped. Everyone else is No record. A touch is
        bucketed by its utm_source, then its referrer, then Direct.
      </Note>
    </Section>
  )
}

function SourceTable({ title, rows }) {
  return (
    <Table minWidth={300} head={[[title], ['Leads', 'right'], ['$39', 'right', 'Bought the $39 course'], ['Core', 'right', 'Bought a core workshop']]}>
      {rows.length === 0 ? (
        <Row>
          <Td colSpan={4} muted>
            Nothing in this window.
          </Td>
        </Row>
      ) : (
        rows.map((r) => (
          <Row key={r.label}>
            <Td>{r.label}</Td>
            <Td align="right" mono>{formatCount(r.leads)}</Td>
            <Td align="right" mono>{formatCount(r.tripwire)}</Td>
            <Td align="right" mono>{formatCount(r.core)}</Td>
          </Row>
        ))
      )}
    </Table>
  )
}
