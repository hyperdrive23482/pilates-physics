import { requireAdmin } from '../../_lib/require-admin.js'
import { listTags } from '../../_lib/kit.js'

// GET /api/admin/kit/tags
// Returns the full Kit tag list so the content editor can populate the
// audience selector. Cached for 5 minutes inside kit.js.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const tags = await listTags()
    return res.status(200).json({ tags })
  } catch (err) {
    console.error('admin/kit/tags error:', err)
    return res.status(500).json({ error: err.message ?? 'Failed to load Kit tags' })
  }
}
