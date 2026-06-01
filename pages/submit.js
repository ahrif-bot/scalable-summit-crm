import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Submit() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', title: '', company: '',
    post_link: '', post_summary: '', tagged_people: '',
    reactions: '', comments: '', reposts: '', submitter_email: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.first_name || !form.post_link) {
      setError('First name and LinkedIn post URL are required.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('pending_posts').insert({
      ...form,
      reactions: parseInt(form.reactions) || 0,
      comments: parseInt(form.comments) || 0,
      reposts: parseInt(form.reposts) || 0,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={styles.title}>Submission Received!</h1>
        <p style={styles.sub}>Your post has been submitted for review. The admin will approve it shortly and it will appear in the tracker.</p>
        <a href="/" style={styles.backBtn}>← Back to tracker</a>
      </div>
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <a href="/" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', marginBottom: 20, display: 'block' }}>← Back to tracker</a>

        <div style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontSize: 24, fontStyle: 'italic' }}>Scalable Summit 2026</span>
        </div>
        <h1 style={styles.title}>Submit Your Post</h1>
        <p style={styles.sub}>Add your LinkedIn post to the Scalable Summit tracker. It will be reviewed by the admin before going live.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={styles.row}>
            <Field label="First Name *" value={form.first_name} onChange={v => update('first_name', v)} placeholder="James" required />
            <Field label="Last Name" value={form.last_name} onChange={v => update('last_name', v)} placeholder="Creech" />
          </div>

          {/* Title + Company */}
          <div style={styles.row}>
            <Field label="Your Title" value={form.title} onChange={v => update('title', v)} placeholder="Founder & CEO" />
            <Field label="Company" value={form.company} onChange={v => update('company', v)} placeholder="Acme Corp" />
          </div>

          {/* Post Link */}
          <Field label="LinkedIn Post URL *" value={form.post_link} onChange={v => update('post_link', v)} placeholder="https://linkedin.com/posts/..." type="url" required />

          {/* Summary */}
          <Field label="Post Summary" value={form.post_summary} onChange={v => update('post_summary', v)} placeholder="Brief description of what you shared in your post..." multiline rows={4} />

          {/* Tagged */}
          <Field label="Tagged People / Companies" value={form.tagged_people} onChange={v => update('tagged_people', v)} placeholder="Kaya Yurieff, Jasmine Enberg, Scalable Pod..." multiline rows={2} />

          {/* Engagement */}
          <div style={{ marginBottom: 20 }}>
            <label style={styles.label}>Engagement (as of today)</label>
            <div style={styles.engRow}>
              <EngField label="Reactions" value={form.reactions} color="#C8FF00" onChange={v => update('reactions', v)} />
              <EngField label="Comments" value={form.comments} color="#00E5CC" onChange={v => update('comments', v)} />
              <EngField label="Reposts" value={form.reposts} color="#FFD93D" onChange={v => update('reposts', v)} />
            </div>
          </div>

          {/* Email */}
          <Field label="Your Email (so we can link your account)" value={form.submitter_email} onChange={v => update('submitter_email', v)} placeholder="you@example.com" type="email" />

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? 'Submitting…' : 'Submit Post for Review'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false, rows = 3, required = false }) {
  return (
    <div style={{ marginBottom: 16, flex: 1 }}>
      <label style={styles.label}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
            style={{ background: 'var(--navy)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', borderRadius: 6, color: 'var(--white)', fontFamily: 'Outfit, sans-serif', fontSize: 13, padding: '8px 12px', outline: 'none', resize: 'vertical' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
            style={{ background: 'var(--navy)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', borderRadius: 6, color: 'var(--white)', fontFamily: 'Outfit, sans-serif', fontSize: 13, padding: '8px 12px', outline: 'none' }} />
      }
    </div>
  )
}

function EngField({ label, value, color, onChange }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <label style={{ ...styles.label, textAlign: 'center', display: 'block' }}>{label}</label>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)} placeholder="0"
        style={{ width: '100%', background: 'var(--navy)', border: `1px solid ${color}`, borderRadius: 6, color, fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, textAlign: 'center', padding: '8px 6px', outline: 'none' }} />
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--navy)', display: 'flex', justifyContent: 'center', padding: '40px 24px' },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '36px', width: '100%', maxWidth: 640 },
  logo: { marginBottom: 6 },
  title: { fontFamily: 'DM Serif Display, serif', fontSize: 26, color: 'var(--white)', marginBottom: 6, fontStyle: 'italic' },
  sub: { color: 'var(--muted)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 },
  label: { display: 'block', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 5 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  engRow: { display: 'flex', gap: 16 },
  submitBtn: { width: '100%', background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 8, border: 'none', cursor: 'pointer', marginTop: 8 },
  backBtn: { display: 'inline-block', marginTop: 24, color: 'var(--neon)', fontSize: 14, textDecoration: 'none' },
  error: { background: 'rgba(255,85,102,0.1)', border: '1px solid rgba(255,85,102,0.3)', borderRadius: 6, padding: '10px 14px', color: '#ff5566', fontSize: 13, marginBottom: 16 },
}
