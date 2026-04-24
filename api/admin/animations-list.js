import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { requireAdmin } from '../_lib/require-admin.js'

// Returns the list of private animations available under /animations/.
// Titles are pulled from each file's <title> tag when present.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const dir = join(process.cwd(), 'animations')
    const files = readdirSync(dir).filter((f) => f.endsWith('.html'))
    const animations = files
      .map((name) => {
        const content = readFileSync(join(dir, name), 'utf8')
        const m = content.match(/<title>([^<]*)<\/title>/i)
        const title = m ? m[1].trim() : name.replace(/\.html$/, '')
        return { name, title }
      })
      .sort((a, b) => a.title.localeCompare(b.title))
    return res.status(200).json({ animations })
  } catch (err) {
    console.error('animations-list error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal error' })
  }
}
