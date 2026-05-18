import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWorkshop } from '../hooks/useWorkshops'
import DynamicSurveyForm from '../components/survey/DynamicSurveyForm'
import '../styles/ppv2.css'
import './Survey101.css'

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

function StateMessage({ kicker, title, children }) {
  return (
    <div className="ppv2 grid-bg">
      <Hero kicker={kicker} title={title} />
      <section className="survey-state">
        <div className="container container--narrow">{children}</div>
      </section>
    </div>
  )
}

export default function Survey() {
  const { slug } = useParams()
  const { workshop, loading } = useWorkshop(slug)
  const [submitted, setSubmitted] = useState(false)

  if (loading) {
    return (
      <StateMessage kicker="§ Workshop Feedback" title="Loading.">
        <p>One moment.</p>
      </StateMessage>
    )
  }

  if (!workshop) {
    return (
      <StateMessage kicker="§ Workshop Feedback" title="Not found.">
        <p>
          We couldn't find that workshop. See the{' '}
          <Link to="/education">education</Link> page for current workshops.
        </p>
      </StateMessage>
    )
  }

  const config = workshop.survey_config
  const now = Date.now()
  const enabled = !!config?.enabled
  const opensAt = config?.opens_at ? Date.parse(config.opens_at) : null
  const closesAt = config?.closes_at ? Date.parse(config.closes_at) : null

  if (!enabled || (closesAt != null && now >= closesAt)) {
    return (
      <StateMessage
        kicker="§ Workshop Feedback"
        title={<>{workshop.title} <span className="italic accent">survey.</span></>}
      >
        <p>
          The survey period is closed. See the{' '}
          <Link to="/education">education</Link> page for upcoming workshops.
        </p>
      </StateMessage>
    )
  }

  if (opensAt != null && now < opensAt) {
    return (
      <StateMessage
        kicker="§ Workshop Feedback"
        title={<>{workshop.title} <span className="italic accent">survey.</span></>}
      >
        <p>The survey hasn't opened yet. Check back after the workshop.</p>
      </StateMessage>
    )
  }

  if (submitted) {
    return (
      <StateMessage
        kicker="§ Workshop Feedback"
        title={<>Thanks, <span className="italic accent">feedback received.</span></>}
      >
        <p>
          That's incredibly helpful. Watch the{' '}
          <Link to="/education">education</Link> page for the next workshop.
        </p>
      </StateMessage>
    )
  }

  async function handleSubmit(payload) {
    const res = await fetch('/api/survey-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, webinar_slug: slug }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong. Try again.')
  }

  return (
    <div className="ppv2 grid-bg" data-section-style="alt">
      <Hero
        kicker="§ Workshop Feedback"
        title={<>{workshop.title} <span className="italic accent">feedback.</span></>}
        intro={`Hey there! I have a quick favor to ask. Would you fill this out to help me make ${workshop.title} even better next time? Takes about 5 minutes. Honest feedback is the most useful kind, even if it stings a little. Thank you!`}
      />

      <section className="survey-form-section section--inset">
        <div className="container container--narrow">
          <DynamicSurveyForm
            surveyConfig={config}
            showNameEmail
            onSubmit={handleSubmit}
            onSuccess={() => setSubmitted(true)}
          />
        </div>
      </section>
    </div>
  )
}
