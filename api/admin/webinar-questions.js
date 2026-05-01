import { supabaseAdmin } from '../_lib/supabase-admin.js'
import { requireAdmin } from '../_lib/require-admin.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const webinarId = req.query.webinar_id
  if (!webinarId) {
    return res.status(400).json({ error: 'webinar_id is required' })
  }

  try {
    const [questionsRes, usersRes] = await Promise.all([
      supabaseAdmin
        .from('webinar_questions')
        .select('id, webinar_id, user_id, question, submitted_at, is_answered')
        .eq('webinar_id', webinarId)
        .order('submitted_at', { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

    if (questionsRes.error) throw questionsRes.error
    if (usersRes.error) throw usersRes.error

    const userById = new Map()
    for (const u of usersRes.data.users ?? []) {
      userById.set(u.id, {
        email: u.email ?? '',
        first_name: u.user_metadata?.first_name ?? '',
        last_name: u.user_metadata?.last_name ?? '',
      })
    }

    const questions = (questionsRes.data ?? []).map((q) => {
      const u = userById.get(q.user_id)
      return {
        ...q,
        email: u?.email ?? '',
        first_name: u?.first_name ?? '',
        last_name: u?.last_name ?? '',
      }
    })

    return res.status(200).json({ questions })
  } catch (err) {
    console.error('webinar-questions error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
