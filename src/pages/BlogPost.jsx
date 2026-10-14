import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { renderMarkdown } from '../lib/markdown'
import { useHead, useJsonLd } from '../lib/head'
import {
  BLOG_FALLBACK_IMAGE,
  blogPostingJsonLd,
  blogPostUrl,
  describePost,
} from '../lib/pageMeta'
import '../styles/ppv2.css'
import './Blog.css'

// api/render-page.js embeds the post it already fetched for the static HTML,
// so the first render can show it without a second round trip and without
// flashing "Loading…" over the article the visitor is already reading.
function readPrerenderedPost(slug) {
  if (typeof document === 'undefined') return null
  const el = document.getElementById('pp-prerender')
  if (!el) return null
  try {
    const data = JSON.parse(el.textContent)
    return data?.post?.slug === slug ? data.post : null
  } catch {
    return null
  }
}

export default function BlogPost() {
  const { slug } = useParams()
  const [prerendered] = useState(() => readPrerenderedPost(slug))
  const [post, setPost] = useState(prerendered)
  const [loading, setLoading] = useState(!prerendered)
  const [notFound, setNotFound] = useState(false)
  const [zoom, setZoom] = useState(null)

  const pageUrl = blogPostUrl(slug)
  useHead({
    title: notFound ? 'Post not found' : post?.title || 'Blog',
    description: describePost(post),
    canonical: pageUrl,
    image: post?.featured_image_url || BLOG_FALLBACK_IMAGE,
    type: 'article',
    noindex: notFound,
  })
  useJsonLd(blogPostingJsonLd(post, pageUrl))

  // Click-to-enlarge for any image in the rendered markdown body. The body is
  // injected via dangerouslySetInnerHTML, so we delegate the click here rather
  // than wiring a handler onto each <img>.
  function handleBodyClick(e) {
    if (e.target.tagName === 'IMG') {
      setZoom({ src: e.target.currentSrc || e.target.src, alt: e.target.alt })
    }
  }

  useEffect(() => {
    if (prerendered?.slug === slug) return undefined
    let cancelled = false
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select(
          'id, slug, title, excerpt, body_html, body_markdown, published_at, updated_at, featured_image_url, featured_image_alt',
        )
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
  }, [slug, prerendered])

  if (loading) {
    return (
      <div className="ppv2 grid-bg">
        <section className="blog-state">
          <div className="container container--narrow">
            <p className="blog-list__loading">Loading…</p>
          </div>
        </section>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="ppv2 grid-bg">
        <section className="blog-state">
          <div className="container container--narrow">
            <h1>Post not found</h1>
            <Link to="/blog" className="arrow-link">← Back to all posts</Link>
          </div>
        </section>
      </div>
    )
  }

  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <article className="ppv2 grid-bg">
      <header className="blog-post__header">
        <div className="container container--narrow">
          <Link to="/blog" className="blog-post__back">
            ← The Pilates Physics Blog
          </Link>
          <h1 className="blog-post__title">{post.title}</h1>
          <p className="blog-post__date">{date}</p>
        </div>
      </header>

      {post.featured_image_url && (
        <div className="blog-post__feature">
          <div className="container container--narrow">
            <div className="meet__photo">
              <div className="meet__photo-tag">
                <span className="meet__photo-tag-id">FIG. 01</span>
                <span>{post.featured_image_alt || 'IMAGE'}</span>
              </div>
              <img
                src={post.featured_image_url}
                alt={post.featured_image_alt || ''}
                className="blog-zoomable"
                onClick={() =>
                  setZoom({ src: post.featured_image_url, alt: post.featured_image_alt || '' })
                }
              />
            </div>
          </div>
        </div>
      )}

      <section className="blog-post__body">
        <div className="container container--narrow">
          <div
            className="blog-body"
            onClick={handleBodyClick}
            dangerouslySetInnerHTML={{
              __html: post.body_html || renderMarkdown(post.body_markdown),
            }}
          />
        </div>
      </section>

      <Lightbox image={zoom} onClose={() => setZoom(null)} />
    </article>
  )
}

// Full-screen overlay that shows a single image at its natural size. Portaled to
// <body> so it sits above the navbar and isn't clipped by the article's layout.
// Click anywhere or press Escape to dismiss.
function Lightbox({ image, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!image) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [image, onClose])

  if (!image) return null

  return createPortal(
    <div
      className="blog-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt || 'Enlarged image'}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="blog-lightbox__close"
        aria-label="Close enlarged image"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      <img className="blog-lightbox__img" src={image.src} alt={image.alt || ''} />
    </div>,
    document.body,
  )
}
