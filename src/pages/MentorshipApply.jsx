import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowSvg from '../components/ui/ArrowSvg'
import {
  MENTORSHIP_PATH,
  PRICE_FULL,
  PRICE_INSTALLMENT,
  PRICE_INSTALLMENT_TOTAL,
  YEARS_OPTIONS,
  PLAN_OPTIONS,
  EQUIPMENT_OPTIONS,
} from '../lib/mentorship'
import '../styles/ppv2.css'
import './Mentorship.css'

export default function MentorshipApply() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [yearsTeaching, setYearsTeaching] = useState('')
  const [mainCareer, setMainCareer] = useState('')
  const [privatesPerWeek, setPrivatesPerWeek] = useState('')
  const [groupsPerWeek, setGroupsPerWeek] = useState('')
  const [equipment, setEquipment] = useState([])
  const [trainingBackground, setTrainingBackground] = useState('')
  const [goalsAndInterest, setGoalsAndInterest] = useState('')
  const [paymentPlan, setPaymentPlan] = useState('')
  const [acknowledgement, setAcknowledgement] = useState(false)
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const loading = status === 'loading'

  function toggleEquipment(option) {
    setEquipment((prev) =>
      prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option],
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (equipment.length === 0) {
      setErrorMsg('Please select at least one piece of equipment.')
      setStatus('error')
      return
    }
    if (!acknowledgement) {
      setErrorMsg('Please confirm the participation note to continue.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'mentorship',
          name,
          email,
          city,
          yearsTeaching,
          mainCareer,
          privatesPerWeek,
          groupsPerWeek,
          equipment,
          trainingBackground,
          goalsAndInterest,
          paymentPlan,
          acknowledgement,
          website,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Try again.')
      setStatus('error')
    }
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      <section className="section-pad mentorship-apply">
        <div className="container container--narrow">
          <Link to={MENTORSHIP_PATH} className="arrow-link mentorship-apply__back">
            ← Back to the mentorship
          </Link>

          <div className="kicker">§ 01 · Application</div>
          <h1 className="mentorship-apply__head">
            Apply to join the <span className="italic accent">fall cohort.</span>
          </h1>
          <p className="mentorship-apply__lede">
            Eight weeks, October 21 to December 16, Wednesdays at 9:00am PT.
            Tell me about your teaching and what you want out of it. I read
            every application personally, in the order they arrive, and you will
            hear back within a week. {PRICE_FULL} one-time, or two payments of{' '}
            {PRICE_INSTALLMENT} ({PRICE_INSTALLMENT_TOTAL} in total), invoiced
            once you are accepted.
          </p>

          <div className="mentorship-apply__panel">
            {status === 'success' ? (
              <div className="mentorship-reserve__success">
                <p className="mentorship-reserve__success-head">§ Received</p>
                <p className="mentorship-reserve__success-body">
                  Thanks, your application is in. I read every one personally
                  and will reply within a week. Check your inbox for a
                  confirmation email.
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
                    placeholder="So I know your time zone"
                    className="pp-form__input"
                  />
                </div>

                <div className="pp-form__row">
                  <div className="pp-form__field">
                    <label className="pp-form__label">Years teaching Pilates</label>
                    <select
                      required
                      value={yearsTeaching}
                      onChange={(e) => setYearsTeaching(e.target.value)}
                      disabled={loading}
                      className="pp-form__select"
                    >
                      <option value="">Select one…</option>
                      {YEARS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pp-form__field">
                    <label className="pp-form__label">Is teaching your main career?</label>
                    <select
                      required
                      value={mainCareer}
                      onChange={(e) => setMainCareer(e.target.value)}
                      disabled={loading}
                      className="pp-form__select"
                    >
                      <option value="">Select one…</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="pp-form__row">
                  <div className="pp-form__field">
                    <label className="pp-form__label">Privates per week</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={privatesPerWeek}
                      onChange={(e) => setPrivatesPerWeek(e.target.value)}
                      disabled={loading}
                      className="pp-form__input"
                    />
                    <p className="pp-form__help">On an average week. 0 is fine.</p>
                  </div>
                  <div className="pp-form__field">
                    <label className="pp-form__label">Group classes per week</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={groupsPerWeek}
                      onChange={(e) => setGroupsPerWeek(e.target.value)}
                      disabled={loading}
                      className="pp-form__input"
                    />
                    <p className="pp-form__help">On an average week. 0 is fine.</p>
                  </div>
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Equipment you teach on regularly</label>
                  <div className="mentorship-apply__checks">
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <label key={option} className="mentorship-apply__check">
                        <input
                          type="checkbox"
                          checked={equipment.includes(option)}
                          onChange={() => toggleEquipment(option)}
                          disabled={loading}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Your training and certifications</label>
                  <textarea
                    required
                    value={trainingBackground}
                    onChange={(e) => setTrainingBackground(e.target.value)}
                    disabled={loading}
                    maxLength={2000}
                    rows={4}
                    placeholder="Where you trained, when you certified, and any workshops that changed how you teach."
                    className="pp-form__textarea"
                  />
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Why this program, and what do you want out of it?</label>
                  <textarea
                    required
                    value={goalsAndInterest}
                    onChange={(e) => setGoalsAndInterest(e.target.value)}
                    disabled={loading}
                    maxLength={2000}
                    rows={5}
                    placeholder="The clients you find hardest to teach, the classes you want to run better, the thing you keep wondering about."
                    className="pp-form__textarea"
                  />
                </div>

                <div className="pp-form__field">
                  <label className="pp-form__label">Payment option</label>
                  <select
                    required
                    value={paymentPlan}
                    onChange={(e) => setPaymentPlan(e.target.value)}
                    disabled={loading}
                    className="pp-form__select"
                  >
                    <option value="">Select one…</option>
                    {PLAN_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <p className="pp-form__help">Invoiced by Stripe once you are accepted. Nothing is charged now.</p>
                </div>

                <label className="mentorship-apply__check mentorship-apply__check--ack">
                  <input
                    type="checkbox"
                    checked={acknowledgement}
                    onChange={(e) => setAcknowledgement(e.target.checked)}
                    disabled={loading}
                  />
                  <span>
                    I understand that the program works best with live attendance on
                    Wednesdays, recording my own teaching between sessions, and
                    scheduling my two private sessions during the eight weeks. Life
                    happens, but showing up is what makes the feedback worth it.
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
