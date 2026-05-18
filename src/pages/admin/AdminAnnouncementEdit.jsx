import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useEnrollment } from '../../hooks/useEnrollment'
import { useAdminAnnouncement } from '../../hooks/admin/useAllAnnouncements'
import { supabase } from '../../lib/supabase'
import AdminNav from '../../components/admin/AdminNav'
import AnnouncementForm from '../../components/admin/AnnouncementForm'

export default function AdminAnnouncementEdit() {
  const { id } = useParams()
  const isNew = !id
  const { user, signOut } = useEnrollment()
  const { announcement, loading, refetch } = useAdminAnnouncement(isNew ? null : id)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  async function save(payload) {
    setSaving(true)
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from('announcements')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        navigate(`/admin/announcements/${data.id}/edit`, { replace: true })
      } else {
        const { error } = await supabase
          .from('announcements')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', announcement.id)
        if (error) throw error
        refetch()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <AdminNav user={user} onSignOut={signOut} />

      <main className="pp-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Link
          to="/admin/announcements"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.8rem',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          <ArrowLeft size={14} /> Back to announcements
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: 'var(--color-ink)',
            margin: '0 0 2rem',
          }}
        >
          {isNew ? 'New announcement' : 'Edit announcement'}
        </h1>

        {!isNew && loading ? (
          <p style={{ color: 'var(--color-ink-muted)', fontSize: '0.9rem' }}>Loading…</p>
        ) : (
          <AnnouncementForm
            initial={announcement}
            onSubmit={save}
            submitLabel={isNew ? 'Create announcement' : 'Save changes'}
            busy={saving}
          />
        )}
      </main>
    </div>
  )
}
