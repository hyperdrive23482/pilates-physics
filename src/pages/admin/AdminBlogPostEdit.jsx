import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { Save, ChevronLeft, Trash2, ExternalLink, Undo2 } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAPI } from '../../hooks/admin/useAdminAPI'
import AdminNav from '../../components/admin/AdminNav'
import FileUpload from '../../components/admin/FileUpload'
import InlineImageUpload from '../../components/admin/InlineImageUpload'

const STATUS_LABELS = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(local) {
  if (!local) return null
  return new Date(local).toISOString()
}

export default function AdminBlogPostEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, signOut } = useEnrollment()
  const { request } = useAdminAPI()

  const [post, setPost] = useState(null)
  const [linkedPieces, setLinkedPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [bodyMd, setBodyMd] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [featuredImageAlt, setFeaturedImageAlt] = useState('')
  const [status, setStatus] = useState('draft')
  const [scheduledFor, setScheduledFor] = useState('')
  const [publishedAt, setPublishedAt] = useState('')

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const dirtyRef = useRef(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await request(`/api/admin/content/blog-posts?id=${id}`)
      setPost(data.post)
      setLinkedPieces(data.linked_pieces ?? [])
      if (!dirtyRef.current) {
        setTitle(data.post.title ?? '')
        setSlug(data.post.slug ?? '')
        setExcerpt(data.post.excerpt ?? '')
        setBodyMd(data.post.body_markdown ?? '')
        setFeaturedImageUrl(data.post.featured_image_url ?? '')
        setFeaturedImageAlt(data.post.featured_image_alt ?? '')
        setStatus(data.post.status ?? 'draft')
        setScheduledFor(toDatetimeLocal(data.post.scheduled_for))
        setPublishedAt(toDatetimeLocal(data.post.published_at))
      }
      setError(null)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [request, id])

  useEffect(() => {
    refetch()
  }, [refetch])

  function markDirty(setter) {
    return (val) => {
      dirtyRef.current = true
      setter(val)
    }
  }

  async function saveEdits() {
    if (!title.trim()) {
      alert('Title is required.')
      return
    }
    if (!slug.trim()) {
      alert('Slug is required.')
      return
    }
    if (!bodyMd.trim()) {
      alert('Body content is required.')
      return
    }
    setSaving(true)
    try {
      await request(`/api/admin/content/blog-posts?id=${id}`, {
        method: 'PATCH',
        body: {
          title,
          slug,
          excerpt,
          body_markdown: bodyMd,
          featured_image_url: featuredImageUrl || null,
          featured_image_alt: featuredImageAlt || null,
          status,
          scheduled_for: status === 'scheduled' ? fromDatetimeLocal(scheduledFor) : null,
          published_at: publishedAt ? fromDatetimeLocal(publishedAt) : null,
        },
      })
      dirtyRef.current = false
      setSavedAt(new Date())
      await refetch()
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    }
    setSaving(false)
  }

  async function unpublish() {
    if (!confirm('Revert this post to draft? It will be hidden from the public blog. You can republish later.')) {
      return
    }
    try {
      await request(`/api/admin/content/blog-posts?id=${id}`, {
        method: 'PATCH',
        body: { status: 'draft' },
      })
      dirtyRef.current = false
      await refetch()
    } catch (e) {
      alert(`Unpublish failed: ${e.message}`)
    }
  }

  async function deletePost() {
    const linkedNote = linkedPieces.length
      ? `\n\nNote: ${linkedPieces.length} content piece(s) link to this post — they'll have their blog_post_id cleared (the pieces themselves stay).`
      : ''
    if (!confirm(`Permanently delete this blog post? This cannot be undone.${linkedNote}`)) {
      return
    }
    try {
      await request(`/api/admin/content/blog-posts?id=${id}`, { method: 'DELETE' })
      navigate('/admin/content/blog-posts')
    } catch (e) {
      alert(`Delete failed: ${e.message}`)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AdminNav user={user} onSignOut={signOut} />
        <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>
        </main>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <AdminNav user={user} onSignOut={signOut} />
        <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: '#ff7d7d' }}>{error || 'Post not found'}</p>
          <Link to="/admin/content/blog-posts" style={{ color: 'var(--color-accent)' }}>
            ← Back to blog posts
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }} data-color-mode="dark">
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <Link
          to="/admin/content/blog-posts"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            marginBottom: '1rem',
          }}
        >
          <ChevronLeft size={14} /> Blog posts
        </Link>

        <div className="pp-header-row" style={{ marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                color: 'var(--color-ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {post.title || 'Untitled'}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
                fontSize: '0.8rem',
                color: 'var(--color-ink-muted)',
              }}
            >
              <StatusPill status={post.status} />
              <code style={{ fontSize: '0.75rem' }}>/{post.slug}</code>
              {post.status === 'published' && (
                <Link
                  to={`/blog/${post.slug}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--color-accent)',
                    textDecoration: 'none',
                  }}
                >
                  View live <ExternalLink size={12} />
                </Link>
              )}
              {post.canonical_url && (
                <a
                  href={post.canonical_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--color-ink-muted)',
                    textDecoration: 'none',
                  }}
                >
                  Canonical <ExternalLink size={12} />
                </a>
              )}
            </div>
            {linkedPieces.length > 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)', marginTop: '0.5rem' }}>
                Linked from {linkedPieces.length} content piece(s) — body edits here may be
                overwritten if the linked piece is saved.
              </p>
            )}
          </div>
        </div>

        <Section title="Metadata">
          <FieldLabel>Title</FieldLabel>
          <input
            type="text"
            value={title}
            onChange={(e) => markDirty(setTitle)(e.target.value)}
            style={inputStyle}
          />
          <div style={{ height: '0.75rem' }} />
          <FieldLabel>Slug</FieldLabel>
          <input
            type="text"
            value={slug}
            onChange={(e) => markDirty(setSlug)(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', margin: '0.3rem 0 0' }}>
            Lowercase letters, numbers, and hyphens only. Changing this breaks any existing
            inbound links.
          </p>
          <div style={{ height: '0.75rem' }} />
          <FieldLabel>Excerpt</FieldLabel>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => markDirty(setExcerpt)(e.target.value)}
            placeholder="Short preview shown on the blog index"
            style={textareaStyle}
          />
        </Section>

        <Section title="Featured image">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <FileUpload
              bucket="blog-images"
              pathPrefix={`blog/${id}`}
              returnUrl
              accept="image/*"
              value={featuredImageUrl}
              onChange={markDirty(setFeaturedImageUrl)}
            />
            {featuredImageUrl && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '320px',
                  aspectRatio: '16 / 9',
                  border: '1px solid var(--color-rule)',
                  background: 'var(--color-bg)',
                }}
              >
                <img
                  src={featuredImageUrl}
                  alt={featuredImageAlt || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}
            <input
              type="text"
              value={featuredImageAlt}
              onChange={(e) => markDirty(setFeaturedImageAlt)(e.target.value)}
              placeholder="Alt text (describe the image for screen readers)"
              style={inputStyle}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', margin: 0 }}>
              Recommended ~1600×900, JPEG/WebP, under 500 KB.
            </p>
          </div>
        </Section>

        <Section title="Body">
          <div style={{ marginBottom: '0.5rem' }}>
            <InlineImageUpload pathPrefix={`blog/${id}`} label="Upload image for body" />
          </div>
          <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-rule)' }}>
            <MDEditor
              value={bodyMd}
              onChange={markDirty(setBodyMd)}
              height={500}
              preview="live"
              visibleDragbar={false}
            />
          </div>
        </Section>

        <Section title="Publish">
          <FieldLabel>Status</FieldLabel>
          <select
            value={status}
            onChange={(e) => markDirty(setStatus)(e.target.value)}
            style={{ ...inputStyle, maxWidth: '260px' }}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>

          {status === 'scheduled' && (
            <>
              <div style={{ height: '0.75rem' }} />
              <FieldLabel>Scheduled for</FieldLabel>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => markDirty(setScheduledFor)(e.target.value)}
                style={{ ...inputStyle, maxWidth: '260px' }}
              />
            </>
          )}

          {status === 'published' && (
            <>
              <div style={{ height: '0.75rem' }} />
              <FieldLabel>Published at</FieldLabel>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => markDirty(setPublishedAt)(e.target.value)}
                style={{ ...inputStyle, maxWidth: '260px' }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--color-ink-muted)', margin: '0.3rem 0 0' }}>
                Controls the date shown on the blog index. Leave blank to use now.
              </p>
            </>
          )}

          <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={saveEdits} disabled={saving} style={primaryBtn(saving)}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            {post.status === 'published' && (
              <button type="button" onClick={unpublish} style={secondaryBtn}>
                <Undo2 size={14} /> Unpublish (revert to draft)
              </button>
            )}
            {savedAt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-ink-muted)' }}>
                Saved at {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-rule)' }}>
            <button type="button" onClick={deletePost} style={dangerBtn}>
              <Trash2 size={14} /> Delete post
            </button>
          </div>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-rule)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          color: 'var(--color-ink)',
          margin: '0 0 1rem',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function StatusPill({ status }) {
  const bg =
    {
      draft: 'rgba(255,255,255,0.06)',
      scheduled: 'rgba(255,180,100,0.18)',
      published: 'rgba(100,255,150,0.15)',
    }[status] ?? 'rgba(255,255,255,0.06)'
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.7rem',
        padding: '0.2rem 0.5rem',
        background: bg,
        color: 'var(--color-ink)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontWeight: 600,
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-ink-muted)',
        marginBottom: '0.4rem',
      }}
    >
      {children}
    </label>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-rule)',
  color: 'var(--color-ink)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-serif)',
  outline: 'none',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  fontFamily: 'inherit',
}

function primaryBtn(disabled) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.7rem 1.1rem',
    background: 'var(--color-accent)',
    color: 'var(--color-accent-ink)',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

const secondaryBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.1rem',
  background: 'transparent',
  color: 'var(--color-ink)',
  border: '1px solid var(--color-rule)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
}

const dangerBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.7rem 1.1rem',
  background: 'transparent',
  color: '#ff7d7d',
  border: '1px solid rgba(255,125,125,0.4)',
  fontSize: '0.85rem',
  fontWeight: 500,
  cursor: 'pointer',
}
