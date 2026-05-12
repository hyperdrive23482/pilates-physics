import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error: err } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, published_at, featured_image_url, featured_image_alt')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      if (cancelled) return
      if (err) setError(err.message)
      else setPosts(data ?? [])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <section
        style={{
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '6rem 2rem 4rem' }}>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              margin: '0 0 0.75rem',
            }}
          >
            The Pilates Physics Blog
          </p>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              margin: 0,
            }}
          >
            Notes on the physics of Pilates
          </h1>
        </div>
      </section>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '4rem 2rem' }}>
        {loading && <p style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>}
        {error && <p style={{ color: '#ff7d7d' }}>{error}</p>}
        {!loading && posts.length === 0 && (
          <p style={{ color: 'var(--color-ink-muted)' }}>No posts yet — the first one is on its way.</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {posts.map((p) => (
            <article
              key={p.id}
              style={{
                paddingBottom: '2.5rem',
                borderBottom: '1px solid var(--color-rule)',
              }}
            >
              <Link
                to={`/blog/${p.slug}`}
                style={{ textDecoration: 'none', display: 'block', color: 'var(--color-ink)' }}
                className={p.featured_image_url ? 'pp-blog-card' : undefined}
              >
                {p.featured_image_url && (
                  <div className="pp-blog-card-thumb">
                    <img
                      src={p.featured_image_url}
                      alt={p.featured_image_alt || ''}
                      loading="lazy"
                    />
                  </div>
                )}
                <div className={p.featured_image_url ? 'pp-blog-card-text' : undefined}>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-ink-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    {p.published_at ? new Date(p.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </p>
                  <h2
                    style={{
                      fontFamily: '"DM Serif Display", serif',
                      fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                      lineHeight: 1.2,
                      margin: '0 0 0.75rem',
                    }}
                  >
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p
                      style={{
                        fontSize: '1rem',
                        lineHeight: 1.6,
                        color: 'var(--color-ink-muted)',
                        margin: 0,
                      }}
                    >
                      {p.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
