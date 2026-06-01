import { useState } from 'react'

export default function PostRow({ post, onSave }) {
  const [form, setForm] = useState({
    first_name: post.first_name || '',
    last_name: post.last_name || '',
    title: post.title || '',
    company: post.company || '',
    post_link: post.post_link || '',
    post_summary: post.post_summary || '',
    tagged_people: post.tagged_people || '',
    reactions: post.reactions || 0,
    comments: post.comments || 0,
    reposts: post.reposts || 0,
  })
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    await onSave(post.id, {
      ...form,
      reactions: parseInt(form.reactions) || 0,
      comments: parseInt(form.comments) || 0,
      reposts: parseInt(form.reposts) || 0,
    })
    setSaving(false)
    setDirty(false)
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <div style={styles.name}>{post.first_name} {post.last_name}</div>
          <div style={styles.meta}>{post.company}{post.title ? ` · ${post.title}` : ''}</div>
        </div>
        <div style={styles.engSummary}>
          <span style={engBadge('#C8FF00')}>{post.reactions} <span style={{ fontSize: 10 }}>react</span></span>
          <span style={engBadge('#00E5CC')}>{post.comments} <span style={{ fontSize: 10 }}>comm</span></span>
          <span style={engBadge('#FFD93D')}>{post.reposts} <span style={{ fontSize: 10 }}>rep</span></span>
        </div>
      </div>

      <div style={styles.grid2}>
        <Field label="First Name" value={form.first_name} onChange={v => update('first_name', v)} />
        <Field label="Last Name" value={form.last_name} onChange={v => update('last_name', v)} />
        <Field label="Title" value={form.title} onChange={v => update('title', v)} />
        <Field label="Company" value={form.company} onChange={v => update('company', v)} />
      </div>

      <Field label="Post Link (LinkedIn URL)" value={form.post_link} onChange={v => update('post_link', v)} type="url" />
      <Field label="Post Summary" value={form.post_summary} onChange={v => update('post_summary', v)} multiline />
      <Field label="Tagged People (comma separated)" value={form.tagged_people} onChange={v => update('tagged_people', v)} multiline rows={3} />

      <div style={styles.engRow}>
        <EngField label="Reactions" value={form.reactions} color="#C8FF00" onChange={v => update('reactions', v)} />
        <EngField label="Comments" value={form.comments} color="#00E5CC" onChange={v => update('comments', v)} />
        <EngField label="Reposts" value={form.reposts} color="#FFD93D" onChange={v => update('reposts', v)} />
      </div>

      <div style={styles.footer}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          Last updated: {new Date(post.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
        <button onClick={handleSave} disabled={saving || !dirty}
          style={{ ...styles.saveBtn, opacity: (!dirty || saving) ? 0.5 : 1, cursor: (!dirty || saving) ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving…' : dirty ? 'Save Changes' : 'Saved ✓'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', multiline = false, rows = 4 }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 5 }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ background: 'var(--navy)', border: '1px solid rgba(255,255,255,0.1)' }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{ background: 'var(--navy)', border: '1px solid rgba(255,255,255,0.1)' }} />
      }
    </div>
  )
}

function EngField({ label, value, color, onChange }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>{label}</label>
      <input type="number" min="0" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', background: 'var(--navy)', border: `1px solid ${color}`, borderRadius: 6, color, fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, textAlign: 'center', padding: '10px 6px' }} />
    </div>
  )
}

function engBadge(color) {
  return {
    background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}`,
    borderRadius: 6, padding: '4px 10px', fontFamily: 'DM Mono, monospace',
    fontSize: 14, fontWeight: 700, color, display: 'inline-flex', alignItems: 'baseline', gap: 3,
  }
}

const styles = {
  card: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 28, marginBottom: 24 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  name: { fontFamily: 'DM Serif Display, serif', fontSize: 22, fontStyle: 'italic', color: 'var(--neon)' },
  meta: { fontSize: 12, color: 'var(--muted)', marginTop: 3 },
  engSummary: { display: 'flex', gap: 8 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' },
  engRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' },
  saveBtn: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 14, padding: '10px 28px', borderRadius: 8 },
}
