import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function ProfileSettings() {
  const router = useRouter()
  const [user, setUser]       = useState(null)
  const [form, setForm]       = useState({
    full_name: '', title: '', company: '', bio: '',
    location: '', linkedin_url: '', open_to_outreach: false,
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)
      loadProfile(session.user.id)
    })
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) {
      setForm({
        full_name: data.full_name || '',
        title: data.title || '',
        company: data.company || '',
        bio: data.bio || '',
        location: data.location || '',
        linkedin_url: data.linkedin_url || '',
        open_to_outreach: data.open_to_outreach || false,
      })
    }
    setLoading(false)
  }

  function upd(key, val) { setForm(f => ({ ...f, [key]: val })); setSaved(false) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // Validate LinkedIn URL if provided
    if (form.linkedin_url && !form.linkedin_url.includes('linkedin.com')) {
      setError('Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/yourname)')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        title: form.title || null,
        company: form.company || null,
        bio: form.bio || null,
        location: form.location || null,
        linkedin_url: form.linkedin_url || null,
        open_to_outreach: form.open_to_outreach,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) { setError(error.message); return }
    setSaved(true)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontStyle: 'italic', color: 'var(--peach)' }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <a href="/" style={{ fontSize: 13, color: 'var(--muted)', display: 'block', marginBottom: 24 }}>← Back to Creatorcase</a>

        <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '28px 32px', borderBottom: '0.5px solid var(--border)', background: 'var(--white)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, background: 'var(--peach)', borderRadius: '50%' }} />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--ink)' }}>Creatorcase</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic', color: 'var(--ink)', marginBottom: 4 }}>Your Profile</h1>
            <p style={{ fontSize: 13, color: 'var(--hint)' }}>{user?.email}</p>
          </div>

          {router.query.welcome === '1' && (
            <div style={{ padding: '16px 32px', background: 'var(--sage-lt)', borderBottom: '0.5px solid #C5DCC7' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage-dk)', marginBottom: 3 }}>Welcome to Creatorcase! 👋</div>
              <div style={{ fontSize: 13, color: 'var(--sage-dk)', lineHeight: 1.5 }}>
                Complete your profile to get discovered by brands, sponsors, and collaborators. Adding your LinkedIn takes 30 seconds and makes a big difference.
              </div>
            </div>
          )}

          <form onSubmit={handleSave} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

            {error && (
              <div style={{ background: '#FFF0F0', border: '0.5px solid #FFC5C5', borderRadius: 6, padding: '10px 14px', color: '#C0392B', fontSize: 13 }}>
                {error}
              </div>
            )}

            {saved && (
              <div style={{ background: 'var(--sage-lt)', border: '0.5px solid #C5DCC7', borderRadius: 6, padding: '10px 14px', color: 'var(--sage-dk)', fontSize: 13 }}>
                ✓ Profile saved successfully
              </div>
            )}

            {/* Basic info */}
            <div style={s.group}>
              <div style={s.groupTitle}>Basic Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Field label="Full Name" value={form.full_name} onChange={v => upd('full_name', v)} placeholder="Jay Clouse" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Title" value={form.title} onChange={v => upd('title', v)} placeholder="Founder" />
                  <Field label="Company" value={form.company} onChange={v => upd('company', v)} placeholder="Creator Science" />
                </div>
                <Field label="Location" value={form.location} onChange={v => upd('location', v)} placeholder="Columbus, OH" />
                <div>
                  <label style={s.label}>Bio</label>
                  <textarea value={form.bio} onChange={e => upd('bio', e.target.value)}
                    placeholder="A brief description of what you do in the creator economy…"
                    rows={3}
                    style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }} />
                </div>
              </div>
            </div>

            {/* LinkedIn — featured prominently */}
            <div style={{ ...s.group, border: '1px solid rgba(244,132,95,0.2)', background: '#FFFAF8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={s.groupTitle}>LinkedIn Profile</div>
                <span style={{ fontSize: 10, background: 'var(--peach-lt)', color: 'var(--peach-dk)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>Recommended</span>
              </div>
              <Field
                label="LinkedIn URL"
                value={form.linkedin_url}
                onChange={v => upd('linkedin_url', v)}
                placeholder="https://linkedin.com/in/yourname"
                type="url"
              />
              <p style={{ fontSize: 11, color: 'var(--hint)', marginTop: 8, lineHeight: 1.5 }}>
                Adding your LinkedIn helps brands, sponsors, and collaborators verify who you are. It also improves your discoverability in our people directory and AI search.
              </p>
            </div>

            {/* Open to outreach */}
            <div style={s.group}>
              <div style={s.groupTitle}>Discoverability</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  onClick={() => upd('open_to_outreach', !form.open_to_outreach)}
                  style={{ position: 'relative', width: 44, height: 24, background: form.open_to_outreach ? 'var(--peach)' : 'var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, marginTop: 2 }}>
                  <div style={{ position: 'absolute', top: 2, left: form.open_to_outreach ? 22 : 2, width: 20, height: 20, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>Open to outreach</div>
                  <p style={{ fontSize: 12, color: 'var(--hint)', lineHeight: 1.5 }}>
                    When enabled, Pro subscribers can see your email address and contact you directly. Brands, sponsors, and collaborators use this to reach verified creator economy professionals. You can turn this off at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Save button */}
            <button type="submit" disabled={saving}
              style={{ background: 'var(--peach)', color: '#fff', fontWeight: 700, fontSize: 15, padding: '13px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>

          </form>
        </div>

        {/* LinkedIn prompt card — shown if no LinkedIn yet */}
        {!form.linkedin_url && (
          <div style={{ background: 'var(--white)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 28 }}>💼</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 3 }}>Add your LinkedIn to get discovered</div>
              <div style={{ fontSize: 12, color: 'var(--hint)', lineHeight: 1.5 }}>Profiles with LinkedIn links get 3x more views from brands and sponsors in our directory.</div>
            </div>
          </div>
        )}

        {/* View public profile link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <a href="/people" style={{ fontSize: 13, color: 'var(--peach)' }}>View People Directory →</a>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--hint)', marginBottom: 5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: 'var(--cream)', border: '0.5px solid var(--border)' }} />
    </div>
  )
}

const s = {
  group: { background: 'var(--cream)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '18px 20px' },
  groupTitle: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: 'var(--hint)', marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--hint)', marginBottom: 5 },
}
