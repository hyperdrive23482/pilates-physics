import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { supabaseAdmin } from '../_lib/supabase-admin.js'

// Server-authoritative slug → filename whitelist.
// Filename is NEVER taken from the client — this is the path-traversal defense.
const SLUG_TO_FILE = {
  'animation-spring': 'spring-animation.html',
  'animation-bicep-curl': 'bicep-curl-animation.html',
  'animation-bicep-curl-vertical': 'bicep-curl-vertical-animation.html',
  'animation-horizontal-spring-vertical-dumbbell': 'horizontal-spring-vertical-dumbbell-animation.html',
  'animation-tall-short': 'tall-short-animation.html',
  'animation-elastic-plastic': 'elastic-plastic-animation.html',
  'animation-bridge-knee-torque': 'bridge-knee-torque.html',
  'animation-feet-in-straps-hip-torque': 'feet-in-straps-hip-torque.html',
  'animation-chair-pedal-force': 'chair-pedal-force.html',
  'animation-push-through-bar-force': 'push-through-bar-force.html',
}

// Returns the raw HTML for an animation tool, gated on user entitlement.
// Admins bypass the entitlement check.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(auth.slice(7))
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  const user = userData.user
  const isAdmin = user.user_metadata?.is_admin === true

  const { slug } = req.query
  if (typeof slug !== 'string' || !(slug in SLUG_TO_FILE)) {
    return res.status(404).json({ error: 'Tool not found' })
  }

  const { data: workshop, error: webErr } = await supabaseAdmin
    .from('webinars')
    .select('id, slug, kind')
    .eq('slug', slug)
    .eq('kind', 'tool')
    .maybeSingle()
  if (webErr) return res.status(500).json({ error: webErr.message })
  if (!workshop) return res.status(404).json({ error: 'Tool not found' })

  if (!isAdmin) {
    const { data: ent, error: entErr } = await supabaseAdmin
      .from('user_entitlements')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('webinar_id', workshop.id)
      .maybeSingle()
    if (entErr) return res.status(500).json({ error: entErr.message })
    if (!ent) return res.status(403).json({ error: 'No access' })
    if (ent.expires_at && new Date(ent.expires_at) <= new Date()) {
      return res.status(403).json({ error: 'Access expired' })
    }
  }

  try {
    const dir = join(process.cwd(), 'animations')
    const html = readFileSync(join(dir, SLUG_TO_FILE[slug]), 'utf8')
    return res.status(200).json({ html })
  } catch (err) {
    console.error('portal/animation error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
