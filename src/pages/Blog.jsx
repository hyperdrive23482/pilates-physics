import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/ppv2.css'
import './Blog.css'

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
    <div className="ppv2 grid-bg">
      <section className="blog-hero">
        <div className="container">
          <div className="blog-hero__inner">
            <div className="kicker">§ 01 · Blog</div>
            <h1 className="blog-hero__title">
              Notes on the <span className="italic accent">physics of Pilates.</span>
            </h1>
            <p className="blog-hero__lede">
              Short essays on mechanics, teaching, and the forces in the Pilates environment.
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container container--narrow">
          {loading && <p className="blog-list__loading">Loading…</p>}
          {error && <p className="blog-list__error">{error}</p>}
          {!loading && posts.length === 0 && (
            <p className="blog-list__empty">No posts yet — the first one is on its way.</p>
          )}

          <div className="blog-list">
            {posts.map((p) => {
              const date = p.published_at
                ? new Date(p.published_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''

              return (
                <Link
                  to={`/blog/${p.slug}`}
                  key={p.id}
                  className={`blog-card${p.featured_image_url ? ' blog-card--featured' : ''}`}
                >
                  {p.featured_image_url && (
                    <div className="blog-card__thumb">
                      <img
                        src={p.featured_image_url}
                        alt={p.featured_image_alt || ''}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div>
                    <p className="blog-card__date">{date}</p>
                    <h2 className="blog-card__title">{p.title}</h2>
                    {p.excerpt && <p className="blog-card__excerpt">{p.excerpt}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
