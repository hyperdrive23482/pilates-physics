import { useHead } from '../lib/head'

/**
 * <Head title description canonical image type noindex />
 *
 * Declarative wrapper around useHead for pages with a single return. Pages
 * with early returns (loading, not found) call useHead directly at the top
 * of the component so every branch carries the right tags.
 */
export default function Head(props) {
  useHead(props)
  return null
}
