import { readAttribution } from './attribution'

/**
 * Hands the stored first touch to a Kit embedded form.
 *
 * The newsletter and waitlist forms are rendered by Kit's own script and post
 * straight to Kit, never through our API, so the only way their subscribers
 * carry attribution is as Kit custom fields. Kit's form endpoint accepts
 * `fields[<key>]` inputs for any custom field that exists on the account, so
 * once the form is in the DOM we append hidden inputs for it.
 *
 * REQUIRES these custom fields to exist in Kit (Settings → Custom fields):
 *   utm_source, utm_campaign, referrer, landing_path
 * Without them Kit ignores the inputs. Nothing breaks either way.
 *
 * Best-effort: polls for the form for a few seconds after mount because Kit's
 * script renders asynchronously, then stops.
 */
const FIELDS = [
  ['utm_source', (t) => t.utm_source],
  ['utm_campaign', (t) => t.utm_campaign],
  ['referrer', (t) => t.referrer_host],
  ['landing_path', (t) => t.landing_path],
]

export function attachAttributionToKitForm(container, { attempts = 20, intervalMs = 250 } = {}) {
  if (!container) return () => {}
  const { first } = readAttribution()
  if (!first) return () => {}

  let tries = 0
  let timer = null

  const tick = () => {
    const form = container.querySelector('form')
    if (form) {
      if (!form.dataset.ppAttribution) {
        form.dataset.ppAttribution = '1'
        for (const [key, pick] of FIELDS) {
          const value = pick(first)
          if (!value) continue
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = `fields[${key}]`
          input.value = String(value).slice(0, 100)
          form.appendChild(input)
        }
      }
      return
    }
    tries += 1
    if (tries < attempts) timer = setTimeout(tick, intervalMs)
  }

  tick()
  return () => {
    if (timer) clearTimeout(timer)
  }
}
