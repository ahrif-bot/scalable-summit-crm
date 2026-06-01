import { useState } from 'react'

export default function AdminTable({ posts, onSave, currentUserEmail, isAdmin }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  function canEdit(post) {
    if (isAdmin) return true
    return post.owner_email && post.owner_email.toLowerCase() === currentUserEmail?.toLowerCase()
  }

  function startEdit(post) {
    setEditingId(post.id)
    setEditForm({
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
      owner_email: post.owner_email || '',
    })
  }

  function cancelEdit() { setEditingId(null); setEditForm({}) }

  async function saveEdit(id) {
    await onSave(id, {
      ...editForm,
      reactions: parseInt(editForm.reactions) || 0,
      comments: parseInt(editForm.comments) || 0,
      reposts: parseInt(editForm.reposts) || 0,
    })
    setEditingId(null)
    setEditForm({})
  }

  function upd(key, val) { setEditForm(f => ({ ...f, [key]: val })) }

  return (
    <div style={{ overflowX: 'auto', padding: '0 24px 32px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16, minWidth: 1100 }}>
        <thead>
          <tr>
            {['#', 'Name', 'Company', isAdmin ? 'Owner Email' : null, 'Summary', 'Tagged', 'React', 'Comm', 'Rep', 'Link', 'Actions']
              .filter(Boolean).map(h => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((post, idx) => {
            const isEditing = editingId === post.id
            const userCanEdit = canEdit(post)
            const isOwnRow = post.owner_email?.toLowerCase() === currentUserEmail?.toLowerCase()

            return (
              <tr key={post.id} style={{
                background: isEditing
                  ? 'rgba(200,255,0,0.04)'
                  : isOwnRow && !isAdmin
                  ? 'rgba(200,255,0,0.02)'
                  : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                outline: isOwnRow && !isAdmin ? '1px solid rgba(200,255,0,0.15)' : 'none',
              }}>

                <td style={{ ...styles.td, color: 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: 12, textAlign: 'center', width: 36 }}>{idx + 1}</td>

                {/* Name */}
                <td style={{ ...styles.td, minWidth: 140 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input value={editForm.first_name} onChange={e => upd('first_name', e.target.value)} placeholder="First" style={styles.input} />
                      <input value={editForm.last_name} onChange={e => upd('last_name', e.target.value)} placeholder="Last" style={styles.input} />
                      <input value={editForm.title} onChange={e => upd('title', e.target.value)} placeholder="Title" style={{ ...styles.input, fontSize: 10, color: 'var(--muted)' }} />
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {post.first_name} {post.last_name}
                        {isOwnRow && !isAdmin && <span style={{ fontSize: 9, background: 'var(--neon)', color: 'var(--navy)', padding: '1px 5px', borderRadius: 3, fontWeight: 800 }}>YOU</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{post.title}</div>
                    </div>
                  )}
                </td>

                {/* Company */}
                <td style={{ ...styles.td, minWidth: 120, color: 'var(--muted)', fontSize: 13 }}>
                  {isEditing
                    ? <input value={editForm.company} onChange={e => upd('company', e.target.value)} style={styles.input} />
                    : post.company || '—'
                  }
                </td>

                {/* Owner Email — admin only */}
                {isAdmin && (
                  <td style={{ ...styles.td, minWidth: 160 }}>
                    {isEditing
                      ? <input value={editForm.owner_email} onChange={e => upd('owner_email', e.target.value)} placeholder="user@email.com" style={{ ...styles.input, fontSize: 11 }} />
                      : <span style={{ fontSize: 11, color: post.owner_email ? 'var(--neon)' : 'var(--muted)' }}>
                          {post.owner_email || '— not linked —'}
                        </span>
                    }
                  </td>
                )}

                {/* Summary */}
                <td style={{ ...styles.td, maxWidth: 220 }}>
                  {isEditing
                    ? <textarea value={editForm.post_summary} onChange={e => upd('post_summary', e.target.value)} rows={4} style={{ ...styles.input, fontSize: 11, resize: 'vertical' }} />
                    : <div style={styles.clamp}>{post.post_summary}</div>
                  }
                </td>

                {/* Tagged */}
                <td style={{ ...styles.td, maxWidth: 180 }}>
                  {isEditing
                    ? <textarea value={editForm.tagged_people} onChange={e => upd('tagged_people', e.target.value)} rows={3} style={{ ...styles.input, fontSize: 11, resize: 'vertical' }} />
                    : <div style={{ ...styles.clamp, fontSize: 11, color: 'var(--muted)' }}>{post.tagged_people}</div>
                  }
                </td>

                {/* Metrics */}
                {['reactions', 'comments', 'reposts'].map((field, fi) => {
                  const colors = ['var(--neon)', 'var(--teal)', 'var(--gold)']
                  return (
                    <td key={field} style={{ ...styles.td, textAlign: 'center', width: 70 }}>
                      {isEditing
                        ? <input type="number" min="0" value={editForm[field]} onChange={e => upd(field, e.target.value)}
                            style={{ ...styles.input, textAlign: 'center', color: colors[fi], borderColor: colors[fi], fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 700, width: 64, padding: '4px 4px' }} />
                        : <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 15, fontWeight: 600, color: colors[fi] }}>{post[field] || 0}</span>
                      }
                    </td>
                  )
                })}

                {/* Link */}
                <td style={{ ...styles.td, textAlign: 'center', width: 60 }}>
                  {post.post_link
                    ? <a href={post.post_link} target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', fontSize: 11, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '3px 8px', display: 'inline-block' }}>↗</a>
                    : '—'
                  }
                </td>

                {/* Actions */}
                <td style={{ ...styles.td, textAlign: 'center', width: 110 }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                      <button onClick={() => saveEdit(post.id)} style={styles.saveBtn}>Save</button>
                      <button onClick={cancelEdit} style={styles.cancelBtn}>✕</button>
                    </div>
                  ) : userCanEdit ? (
                    <button onClick={() => startEdit(post)} style={styles.editBtn}>✏ Edit</button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  th: {
    background: 'var(--card2)', color: 'var(--muted)',
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
    padding: '10px 12px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)',
    whiteSpace: 'nowrap',
  },
  td: { padding: '10px 12px', verticalAlign: 'middle' },
  input: {
    background: 'var(--navy)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 4, color: 'var(--white)', fontSize: 12,
    padding: '5px 8px', width: '100%', fontFamily: 'Outfit, sans-serif',
  },
  clamp: {
    fontSize: 12, color: 'var(--light)', lineHeight: 1.4,
    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  saveBtn: {
    background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700,
    fontSize: 12, padding: '5px 12px', borderRadius: 5,
  },
  cancelBtn: {
    background: 'transparent', color: 'var(--muted)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
    fontSize: 12, padding: '5px 10px',
  },
  editBtn: {
    background: 'transparent', color: 'var(--light)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
    fontSize: 12, padding: '5px 12px',
  },
}
