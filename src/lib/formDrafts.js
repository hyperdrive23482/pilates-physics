// Unsaved admin form typing, kept per browser tab.
//
// The admin editors lose what has been typed whenever the tab reloads, and
// Chrome reloads background tabs on its own (Memory Saver) while the admin is
// off in Stripe or Kit copying something. A draft survives that.
//
// sessionStorage, not localStorage: per tab, so two admin tabs never overwrite
// each other's drafts, and still kept across a reload of that tab. Storage can
// be missing or throw (private windows, blocked site data), and a draft is a
// convenience, so every access fails quietly.
//
// Every draft records the `base` it was typed against: the row's id plus its
// updated_at. A draft is only handed back onto the same version of the row. If
// the row has been saved since, from this tab or anywhere else, the draft is
// stale and is dropped rather than quietly overwriting the newer save.

const PREFIX = 'pp-admin-draft:'

// The version of a row. Two fetches of an unchanged row share a base; any save
// produces a new one. `null` (a blank "new" form) has a base of its own.
export function draftBase(row) {
  return row ? `${row.id ?? ''}|${row.updated_at ?? ''}` : 'blank'
}

export function readDraft(key, base) {
  if (!key) return null
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const draft = JSON.parse(raw)
    if (draft?.base !== base) {
      window.sessionStorage.removeItem(PREFIX + key)
      return null
    }
    return draft.value
  } catch {
    return null
  }
}

export function writeDraft(key, base, value) {
  if (!key) return
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify({ base, value }))
  } catch {
    // Storage full or unavailable: the form still works, it just won't survive a reload.
  }
}

export function clearDraft(key) {
  if (!key) return
  try {
    window.sessionStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
