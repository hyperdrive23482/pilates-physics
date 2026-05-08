import { supabaseAdmin } from '../../_lib/supabase-admin.js'
import { requireAdmin } from '../../_lib/require-admin.js'

const KIT_BASE = 'https://api.kit.com/v4'

async function fetchRecentBroadcastStats(limit = 5) {
  if (!process.env.KIT_API_KEY) return []
  try {
    const res = await fetch(`${KIT_BASE}/broadcasts?limit=${limit}`, {
      headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY },
    })
    if (!res.ok) return []
    const data = await res.json()
    const broadcasts = data.broadcasts ?? []
    // Each broadcast may need a separate stats fetch in some Kit plans.
    return Promise.all(
      broadcasts.map(async (b) => {
        let stats = b.stats ?? null
        if (!stats) {
          try {
            const sRes = await fetch(`${KIT_BASE}/broadcasts/${b.id}/stats`, {
              headers: { 'X-Kit-Api-Key': process.env.KIT_API_KEY },
            })
            if (sRes.ok) {
              const sJson = await sRes.json()
              stats = sJson.broadcast?.stats ?? sJson.stats ?? null
            }
          } catch {
            // ignore per-broadcast failures
          }
        }
        return {
          id: b.id,
          subject: b.subject,
          send_at: b.send_at ?? b.published_at ?? null,
          stats: stats
            ? {
                recipients: stats.recipients ?? 0,
                open_rate: stats.open_rate ?? null,
                click_rate: stats.click_rate ?? null,
                opens: stats.opens ?? null,
                clicks: stats.clicks ?? null,
              }
            : null,
        }
      }),
    )
  } catch {
    return []
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const [pieces, ideas, brain, recentBroadcasts, webinars] = await Promise.all([
      supabaseAdmin.from('content_pieces').select('status'),
      supabaseAdmin.from('content_ideas').select('status'),
      supabaseAdmin.from('brain_entries').select('is_active, token_estimate'),
      fetchRecentBroadcastStats(5),
      supabaseAdmin
        .from('webinars')
        .select('id, slug, title, status, scheduled_at')
        .not('scheduled_at', 'is', null)
        .neq('status', 'draft')
        .neq('status', 'archived')
        .order('scheduled_at', { ascending: true }),
    ])

    const pipelineCounts = { drafting: 0, in_review: 0, approved: 0, scheduled: 0, published: 0, archived: 0 }
    for (const p of pieces.data ?? []) {
      if (pipelineCounts[p.status] !== undefined) pipelineCounts[p.status]++
    }

    const ideaCounts = { open: 0, selected: 0, archived: 0 }
    for (const i of ideas.data ?? []) {
      if (ideaCounts[i.status] !== undefined) ideaCounts[i.status]++
    }

    const brainSummary = {
      total_entries: brain.data?.length ?? 0,
      active_entries: (brain.data ?? []).filter((e) => e.is_active).length,
      active_token_estimate: (brain.data ?? [])
        .filter((e) => e.is_active)
        .reduce((sum, e) => sum + (e.token_estimate ?? 0), 0),
    }

    // Upcoming scheduled pieces
    const { data: upcoming } = await supabaseAdmin
      .from('content_pieces')
      .select('id, title, slug, scheduled_for, status')
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true })
      .limit(10)

    // Split workshops into upcoming and past
    const now = Date.now()
    const upcomingWorkshops = []
    const pastWorkshops = []
    for (const w of webinars.data ?? []) {
      const t = w.scheduled_at ? new Date(w.scheduled_at).getTime() : null
      if (t === null) continue
      if (t >= now) upcomingWorkshops.push(w)
      else pastWorkshops.push(w)
    }
    pastWorkshops.reverse() // most recent past first

    return res.status(200).json({
      pipeline_counts: pipelineCounts,
      idea_counts: ideaCounts,
      brain_summary: brainSummary,
      upcoming: upcoming ?? [],
      recent_broadcasts: recentBroadcasts,
      upcoming_workshops: upcomingWorkshops.slice(0, 5),
      past_workshops: pastWorkshops.slice(0, 5),
    })
  } catch (err) {
    console.error('dashboard-stats error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
