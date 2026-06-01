
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function PendingPosts() {
  const [user, setUser]       = useState(null)
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)
  const [nextOrder, setNextOrder] = useState(57)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.email !== ADMIN_EMAIL) {
        window.location.href = '/'
        return
      }
      setUser(session.user)
      fetchPending()
      fetchNextOrder()
    })
  }, [])

  async function fetchPending() {
    const { data } = await supabase
      .from('pending_posts')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    setPosts(data || [])
    setLoading(false)
  }

  async function fetchNextOrder() {
    const { data } = await supabase
      .from('linkedin_posts')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
    if (data && data.length > 0) setNextOrder(data[0].display_order + 1)
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  async function approve(post) {
    const { error } = await supabase.from('linkedin_posts').insert({
      display_order: nextOrder,
      first_name: post.first_name,
      last_name: post.last_name,
      title: post.title,
      company: post.company,
      post_link: post.post_link,
      post_summary: post.post_summary,
      tagged_people: post.tagged_people,
      reactions: post.reactions,
      comments: post.comments,
      reposts: post.reposts,
      owner_email: post.submitter_email,
    })
    if (error) { showToast('Error: ' + error.message, true); return }
    await supabase.from('pending_posts').update({ status: 'approved' }).eq('id', post.id)
    setNextOrder(n => n + 1)
    setPosts(prev => prev.filter(p => p.id !== post.id))
    showToast('✓ Approved and added to tracker!')
  }

  async function reject(post) {
    await supabase.from('pending_posts').update({ status: 'rejected' }).eq('id', post.id)
    setPosts(prev => prev.filter(p => p.id !== post.id))
    showToast('Post rejected')
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
      <div style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontSize: 24 }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, background: toast.isError ? '#ff5566' : 'var(--neon)', color: toast.isError ? '#fff' : 'var(--navy)', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8 }}>{toast.msg}</div>
      )}

      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>Scalable Summit 2026</span>
          <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 8 }}>Admin — Pending Submissions</span>
        </div>
        <a href="/" style={styles.navBtn}>← Back to Tracker</a>
      </header>

      <div style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, fontStyle: 'italic', color: 'var(--white)' }}>Pending Submissions</h1>
          <span style={{ background: posts.length > 0 ? '#ff5566' : 'var(--card2)', color: posts.length > 0 ? '#fff' : 'var(--muted)', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{posts.length}</span>
        </div>

        {posts.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--neon)', marginBottom: 6 }}>All clear!</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No pending submissions right now.</div>
          </div>
        ) : posts.map(post => (
          <div key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.name}>{post.first_name} {post.last_name}</div>
                <div style={styles.meta}>{post.company}{post.title ? ` · ${post.title}` : ''}</div>
                {post.submitter_email && <div style={{ fontSize: 11, color: 'var(--neon)', marginTop: 3 }}>📧 {post.submitter_email}</div>}
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Submitted: {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => approve(post)} style={styles.approveBtn}>✓ Approve</button>
                <button onClick={() => reject(post)} style={styles.rejectBtn}>✕ Reject</button>
              </div>
            </div>

            <div style={styles.engRow}>
              {[['Reactions', post.reactions, '#C8FF00'], ['Comments', post.comments, '#00E5CC'], ['Reposts', post.reposts, '#FFD93D']].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'center', background: 'var(--navy)', borderRadius: 6, padding: '8px 16px', border: `1px solid ${c}30` }}>
                  <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 22, fontWeight: 700, color: c }}>{v || 0}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
                </div>
              ))}
            </div>

            {post.post_link && <div style={styles.field}><div style={styles.fieldLabel}>Post Link</div><a href={post.post_link} target="_blank" rel="noreferrer" style={{ color: 'var(--neon)', fontSize: 12, wordBreak: 'break-all' }}>{post.post_link}</a></div>}
            {post.post_summary && <div style={styles.field}><div style={styles.fieldLabel}>Summary</div><div style={{ fontSize: 13, color: 'var(--light)', lineHeight: 1.5 }}>{post.post_summary}</div></div>}
            {post.tagged_people && <div style={styles.field}><div style={styles.fieldLabel}>Tagged People</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{post.tagged_people}</div></div>}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  header: { background: '#0f1e38', borderBottom: '1px solid rgba(200,255,0,0.12)', padding: '0 24px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 },
  navBtn: { color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', fontSize: 12 },
  empty: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '48px', textAlign: 'center' },
  card: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 24, marginBottom: 20 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  name: { fontFamily: 'DM Serif Display, serif', fontSize: 22, fontStyle: 'italic', color: 'var(--neon)' },
  meta: { fontSize: 12, color: 'var(--muted)', marginTop: 3 },
  engRow: { display: 'flex', gap: 12, marginBottom: 16 },
  field: { marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.04)' },
  fieldLabel: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: 4 },
  approveBtn: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 13, padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer' },
  rejectBtn: { background: 'transparent', color: '#ff5566', border: '1px solid rgba(255,85,102,0.3)', fontWeight: 600, fontSize: 13, padding: '8px 18px', borderRadius: 6, cursor: 'pointer' },
}
