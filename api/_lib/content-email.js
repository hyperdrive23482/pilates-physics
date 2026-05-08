import { renderMarkdown } from './markdown.js'

const SITE_BASE = process.env.SITE_BASE_URL ?? 'https://pilatesphysics.com'

// Build the final HTML body for the Kit broadcast from a piece's email markdown.
// Appends a "Read the full post" CTA that links to the canonical blog URL,
// unless the markdown already references that URL.
export function buildEmailHtml({ emailMarkdown, slug }) {
  if (!emailMarkdown) return ''
  if (!slug) return renderMarkdown(emailMarkdown)
  const blogUrl = `${SITE_BASE}/blog/${slug}`
  const withLink = emailMarkdown.includes(blogUrl)
    ? emailMarkdown
    : `${emailMarkdown}\n\n[Read the full post →](${blogUrl})`
  return renderMarkdown(withLink)
}

export function blogUrlForSlug(slug) {
  return slug ? `${SITE_BASE}/blog/${slug}` : null
}
