import { useState } from 'react'
import { Link } from 'react-router-dom'
import WorkshopFeedbackForm from '../components/survey/WorkshopFeedbackForm'
import '../styles/ppv2.css'
import './Survey101.css'

const WORKSHOP_TITLE = 'Pilates Physics 101'
// Browser local time — survey closes at midnight on June 1, 2026 wherever the respondent is.
const SURVEY_CUTOFF = new Date('2026-06-01T00:00:00')

function Hero({ kicker, title, intro }) {
  return (
    <section className="survey-hero">
      <div className="container container--narrow">
        <div className="kicker">{kicker}</div>
        <h1 className="survey-hero__title">{title}</h1>
        {intro && <p className="survey-hero__lede">{intro}</p>}
      </div>
    </section>
  )
}

export default function Survey101() {
  const isClosed = new Date() >= SURVEY_CUTOFF

  if (isClosed) {
    return (
      <div className="ppv2 grid-bg">
        <Hero
          kicker="§ 01 · Workshop Feedback"
          title={
            <>
              {WORKSHOP_TITLE} <span className="italic accent">survey.</span>
            </>
          }
        />
        <section className="survey-state">
          <div className="container container--narrow">
            <p>
              The survey period is closed. Please see the{' '}
              <Link to="/education">education</Link>{' '}
              page for upcoming workshops.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return <OpenSurvey />
}

function OpenSurvey() {
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(payload) {
    const res = await fetch('/api/survey-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  }

  if (submitted) {
    return (
      <div className="ppv2 grid-bg">
        <Hero
          kicker="§ 01 · Workshop Feedback"
          title={
            <>
              Thanks — <span className="italic accent">feedback received.</span>
            </>
          }
        />
        <section className="survey-state">
          <div className="container container--narrow">
            <p>
              That's incredibly helpful. Watch the{' '}
              <Link to="/education">education</Link>{' '}
              page for the next workshop.
            </p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      <Hero
        kicker="§ 01 · Workshop Feedback"
        title={
          <>
            {WORKSHOP_TITLE} <span className="italic accent">feedback.</span>
          </>
        }
        intro="Hey there! I have a quick favor to ask. Would you fill this out to help me make Pilates Physics 101 even better next time? Takes about 5 minutes. Honest feedback is the most useful kind, even if it stings a little. Thank you!"
      />

      <section className="survey-form-section section--inset">
        <div className="container container--narrow">
          <WorkshopFeedbackForm
            showNameEmail
            onSubmit={handleSubmit}
            onSuccess={() => setSubmitted(true)}
          />
        </div>
      </section>
    </div>
  )
}
