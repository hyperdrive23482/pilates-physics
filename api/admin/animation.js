import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { requireAdmin } from '../_lib/require-admin.js'

// Returns the raw HTML contents of a single private animation, wrapped in JSON
// so callers can pass it to an <iframe srcdoc={html}>. Filename is whitelisted
// against the /animations/ directory to prevent path traversal.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { name } = req.query
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Missing name parameter' })
  }

  try {
    const dir = join(process.cwd(), 'animations')
    const whitelist = readdirSync(dir).filter((f) => f.endsWith('.html'))
    if (!whitelist.includes(name)) {
      return res.status(404).json({ error: 'Animation not found' })
    }
    const html = readFileSync(join(dir, name), 'utf8')
    return res.status(200).json({ html })
  } catch (err) {
    console.error('animation error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
