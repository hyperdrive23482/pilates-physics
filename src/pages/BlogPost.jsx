import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { renderMarkdown } from '../lib/markdown'

export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, body_html, body_markdown, published_at, featured_image_url, featured_image_alt')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()
      if (cancelled) return
      if (error || !data) setNotFound(true)
      else setPost(data)
      setLoading(false)
    }
    if (slug) load()
    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return (
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 2rem' }}>
        <p style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>
      </section>
    )
  }

  if (notFound || !post) {
    return (
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 2rem' }}>
        <h1 style={{ fontFamily: '"DM Serif Display", serif', color: 'var(--color-ink)' }}>
          Post not found
        </h1>
        <Link to="/blog" style={{ color: 'var(--color-accent)' }}>
          ← Back to all posts
        </Link>
      </section>
    )
  }

  return (
    <article>
      <header
        style={{
          borderBottom: '1px solid var(--color-rule)',
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '6rem 2rem 3rem' }}>
          <Link
            to="/blog"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-accent)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            ← The Pilates Physics Blog
          </Link>
          <h1
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              margin: '1rem 0 0.75rem',
            }}
          >
            {post.title}
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-ink-muted)',
              margin: 0,
            }}
          >
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : ''}
          </p>
        </div>
      </header>

      {post.featured_image_url && (
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 2rem 0' }}>
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              overflow: 'hidden',
              background: 'var(--color-surface)',
            }}
          >
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      )}

      <section style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>
        <div
          className="pp-blog-body"
          style={{
            color: 'var(--color-ink)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{
            __html: post.body_html || renderMarkdown(post.body_markdown),
          }}
        />
      </section>
    </article>
  )
}
