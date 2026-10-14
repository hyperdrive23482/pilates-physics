import { useJsonLd } from '../lib/head'

/**
 * <JsonLd data={{ '@context': 'https://schema.org', '@type': ... }} />
 *
 * Injects a <script type="application/ld+json"> for the page and removes it
 * on unmount. Pass null while the data is still loading.
 */
export default function JsonLd({ data }) {
  useJsonLd(data)
  return null
}
