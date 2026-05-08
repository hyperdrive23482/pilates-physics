import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: true,
  mangle: false,
})

export function renderMarkdown(md) {
  if (!md) return ''
  return marked.parse(md)
}
