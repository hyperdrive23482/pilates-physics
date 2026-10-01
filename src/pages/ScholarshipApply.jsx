import { useState } from 'react'
import ArrowSvg from '../components/ui/ArrowSvg'
import { useCurrentWorkshop } from '../hooks/useWorkshops'
import { COURSE_OPTIONS, STAGE_OPTIONS, MIN_CHARS } from '../lib/scholarship'
import '../styles/ppv2.css'
import './Mentorship.css'
import './Scholarship.css'

// /scholarship. Posts to /api/inquiry (kind: scholarship), which stores the
// application and emails Kaleen. Approval and codes happen in
// /admin/scholarships. See supabase/migrations/056_scholarships.sql.

function CharCount({ value }) {
  const n = value.trim().length
  const short = n < MIN_CHARS
  return (
    <p className={`pp-form__help scholarship__count${short ? '' : ' scholarship__count--ok'}`}>
      {short ? `${n} / ${MIN_CHARS} characters minimum` : `${n} characters`}
    </p>
  )
}

function formatCourseDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ScholarshipApply() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [course, setCourse] = useState('')
  const [pathStage, setPathStage] = useState('')
  const [pathStageOther, setPathStageOther] = useState('')
  const [story, setStory] = useState('')
  const [teachingImpact, setTeachingImpact] = useState('')
  const [acknowledgement, setAcknowledgement] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const loading = status === 'loading'

  // The next cohort of each dated course, resolved the same way its sales
  // page does, so the date here always matches the page the code is used on.
  const { workshop: next101, loading: loading101 } = useCurrentWorkshop('PP-101')
  const { workshop: next102, loading: loading102 } = useCurrentWorkshop('PP-102')
  const nextBySeries = {
    'PP-101': { workshop: next101, loading: loading101 },
    'PP-102': { workshop: next102, loading: loading102 },
  }

  function courseWhen(c) {
    if (c.onDemand) return 'On demand'
    const next = nextBySeries[c.seriesPrefix]
    if (!next || next.loading) return ''
    return next.workshop?.scheduled_at ? formatCourseDate(next.workshop.scheduled_at) : 'Date TBD'
  }

  function fail(message) {
    setErrorMsg(message)
    setStatus('error')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!course) return fail('Please pick a course.')
    if (story.trim().length < MIN_CHARS || teachingImpact.trim().length < MIN_CHARS) {
      return fail(`Please write at least ${MIN_CHARS} characters for each question.`)
    }
    if (!acknowledgement) return fail('Please confirm the note about codes to continue.')
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'scholarship',
          name,
          email,
          city,
          courses: [course],
          pathStage,
          pathStageOther: pathStage === 'other' ? pathStageOther : '',
          story,
          teachingImpact,
          acknowledgement,
          website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      fail(err.message || 'Something went wrong. Try again.')
    }
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      <section className="section-pad mentorship-apply">
        <div className="container container--narrow">
          <div className="kicker">§ Scholarships</div>
          <h1 className="mentorship-apply__head">
            Pilates education, <span className="italic accent">within reach.</span>
          </h1>

          <div className="scholarship__intro">
            <p>
              Pilates and fitness spaces have not been built for everyone. If you are
              Black, Indigenous or a person of color, fat, queer or trans, disabled, or
              have otherwise been pushed to the edges of this industry, and cost has
              been a barrier to education, this scholarship is for you.
            </p>

            <ul className="scholarship__prices">
              {COURSE_OPTIONS.map((c) => (
                <li key={c.value}>
                  <span>{c.label}</span>
                  <span>
                    <strong>{c.price}</strong> <s>{c.full}</s>
                  </span>
                </li>
              ))}
            </ul>

            <ol className="scholarship__steps">
              <li>Apply below. It takes about ten minutes.</li>
              <li>I read every application personally and reply within a week.</li>
              <li>One course per application. Once you have used your code, you are welcome to apply for another.</li>
            </ol>
          </div>

          <div className="mentorship-apply__panel">
            {status === 'success' ? (
              <div className="mentorship-reserve__success">
                <p className="mentorship-reserve__success-head">§ Received</p>
                <p className="mentorship-reserve__success-body">
                  Thank you, your application is in. I read every one personally and
                  will reply within a week. Check your inbox for a confirmation email.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="pp-form">
                <div className="pp-form__row">
                  <div className="pp-form__field">
                    <label className="pp-form__label">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      maxLength={200}
                      className="pp-form__input"
                    />
                  </div>
                  <div className="pp-form__field">
                    <label className="pp-form__label">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      maxLength={320}
                      className="pp-form__input"
                    />
                    <p className="pp-form__help">Use the email you will check out with.</p>
                  </div>
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">City / region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                    maxLength={200}
                    className="pp-form__input"
                  />
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Which course?</label>
                  <div className="scholarship__courses" role="radiogroup">
                    {COURSE_OPTIONS.map((c) => (
                      <label key={c.value} className="mentorship-apply__check">
                        <input
                          type="radio"
                          name="course"
                          value={c.value}
                          checked={course === c.value}
                          onChange={() => setCourse(c.value)}
                          disabled={loading}
                        />
                        <span>
                          {c.label} ({c.price})
                          <span className="scholarship__when">{courseWhen(c)}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Where are you in your Pilates path?</label>
                  <select
                    required
                    value={pathStage}
                    onChange={(e) => setPathStage(e.target.value)}
                    disabled={loading}
                    className="pp-form__select"
                  >
                    <option value="">Select one…</option>
                    {STAGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {pathStage === 'other' && (
                    <input
                      type="text"
                      required
                      value={pathStageOther}
                      onChange={(e) => setPathStageOther(e.target.value)}
                      disabled={loading}
                      maxLength={300}
                      placeholder="Tell me where you are"
                      aria-label="Where you are in your Pilates path"
                      className="pp-form__input scholarship__other"
                    />
                  )}
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">
                    Tell me about your path in Pilates or fitness so far, and what has made
                    access to education harder.
                  </label>
                  <textarea
                    required
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    disabled={loading}
                    maxLength={2000}
                    rows={5}
                    placeholder="Who you are, how you found this work, and what has stood in the way."
                    className="pp-form__textarea"
                  />
                  <CharCount value={story} />
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">
                    Describe a moment in a session when you wished you understood why
                    something worked. What would change in your teaching if you did?
                  </label>
                  <textarea
                    required
                    value={teachingImpact}
                    onChange={(e) => setTeachingImpact(e.target.value)}
                    disabled={loading}
                    maxLength={2000}
                    rows={5}
                    placeholder="A client, an exercise, a spring setting, a cue that did or did not land."
                    className="pp-form__textarea"
                  />
                  <CharCount value={teachingImpact} />
                </div>

                <label className="mentorship-apply__check mentorship-apply__check--ack">
                  <input
                    type="checkbox"
                    checked={acknowledgement}
                    onChange={(e) => setAcknowledgement(e.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    I understand my code works once, for this course, is just for me,
                    and expires 30 days after it is sent.
                  </span>
                </label>

                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ display: 'none' }}
                />

                <button type="submit" disabled={loading} className="btn btn--block btn--lg">
                  {loading ? 'Sending…' : 'Submit application'}
                  {!loading && <ArrowSvg />}
                </button>

                {status === 'error' && <p className="pp-form__error">{errorMsg}</p>}
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
