import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import AdminTable from '../components/AdminTable'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function Home() {
  const [user, setUser]       = useState(null)
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState('reactions-desc')
  const [toast, setToast]     = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  // Auth — don't redirect, just track who's logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setIsAdmin(session.user.email === ADMIN_EMAIL)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setUser(session.user)
        setIsAdmin(session.user.email === ADMIN_EMAIL)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Always load all posts — public or logged in
  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('reactions', { ascending: false })
    if (error) {
      console.error('Fetch error:', error)
      showToast('Error loading posts: ' + error.message, true)
    }
    setPosts(data || [])
    setLoading(false)
  }

  async function handleSave(id, updates) {
    const { error } = await supabase.from('linkedin_posts').update(updates).eq('id', id)
    if (error) { showToast('Error saving: ' + error.message, true); return }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    showToast('✓ Saved successfully')
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('pending_posts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
    showToast('Signed out')
  }

  const filtered = posts.filter(p => {
    const q = search.toLowerCase()
    if (!q) return true
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) ||
      (p.company || '').toLowerCase().includes(q) ||
      (p.post_summary || '').toLowerCase().includes(q) ||
      (p.tagged_people || '').toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    const [key, dir] = sort.split('-')
    const field = key === 'name' ? 'first_name' : key
    const va = a[field] || 0
    const vb = b[field] || 0
    if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return dir === 'asc' ? va - vb : vb - va
  })

  const totals = {
    reactions: posts.reduce((s, p) => s + (p.reactions || 0), 0),
    comments: posts.reduce((s, p) => s + (p.comments || 0), 0),
    reposts: posts.reduce((s, p) => s + (p.reposts || 0), 0),
  }

  const hasOwnRow = user && posts.some(p => p.owner_email?.toLowerCase() === user?.email?.toLowerCase())

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--navy)' }}>
      <div style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontSize: 24 }}>Loading…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: toast.isError ? '#ff5566' : 'var(--neon)',
          color: toast.isError ? '#fff' : 'var(--navy)',
          fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>Scalable</span>
          <span style={{ fontFamily: 'DM Serif Display, serif' }}> Summit 2026</span>
          <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 8 }}>Post Tracker</span>
          {isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
        </div>

        <div style={styles.headerStats}>
          {[['Posts', posts.length], ['Reactions', totals.reactions.toLocaleString()], ['Comments', totals.comments], ['Reposts', totals.reposts]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 16, fontWeight: 600, color: 'var(--neon)' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Auth section top right */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/submit" style={styles.submitBtn2}>+ Submit Post</a>
          {isAdmin && (
            <a href="/admin/pending" style={styles.pendingBtn}>
              Pending {pendingCount > 0 && <span style={{ background: '#ff5566', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, marginLeft: 4 }}>{pendingCount}</span>}
            </a>
          )}
          {user ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</span>
              <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
            </>
          ) : (
            <a href="/login" style={styles.signInBtn}>Sign in →</a>
          )}
        </div>
      </header>

      {/* Top 5 banner */}
      <div style={styles.topBanner}>
        {[...posts].sort((a,b) => b.reactions - a.reactions).slice(0,5).map((p, i) => (
          <div key={p.id} style={styles.topCard}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>#{i+1} by reactions</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: 'var(--neon)' }}>{p.reactions}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.comments} comments · {p.reposts} reposts</div>
          </div>
        ))}
      </div>

      {/* Context banner */}
      {!user && (
        <div style={styles.noticeBanner}>
          <span>👀 Viewing all posts.</span>
          <a href="/login" style={{ color: 'var(--neon)', marginLeft: 8, textDecoration: 'underline' }}>
            Sign in to edit your post →
          </a>
        </div>
      )}
      {user && !isAdmin && hasOwnRow && (
        <div style={styles.noticeBanner}>
          <span style={{ color: 'var(--neon)' }}>✏ Your row is highlighted below — click Edit to update it.</span>
        </div>
      )}
      {user && !isAdmin && !hasOwnRow && (
        <div style={styles.noticeBanner}>
          <span>Your email isn't linked to a row yet.</span>
          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>Contact the admin to get access.</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 13 }}>🔍</span>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, summary, tagged…"
            style={{ paddingLeft: 32, background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ width: 'auto', background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="reactions-desc">↓ Reactions</option>
          <option value="reactions-asc">↑ Reactions</option>
          <option value="comments-desc">↓ Comments</option>
          <option value="reposts-desc">↓ Reposts</option>
          <option value="name-asc">A–Z Name</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>{sorted.length} of {posts.length} posts</span>
      </div>

      <AdminTable
        posts={sorted}
        onSave={handleSave}
        currentUserEmail={user?.email || null}
        isAdmin={isAdmin}
      />
    </div>
  )
}

const styles = {
  header: {
    background: '#0f1e38',
    borderBottom: '1px solid rgba(200,255,0,0.12)',
    padding: '0 24px',
    height: 58,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, fontWeight: 600 },
  adminBadge: {
    background: 'var(--neon)', color: 'var(--navy)', fontSize: 10,
    fontWeight: 800, padding: '2px 7px', borderRadius: 4, letterSpacing: '1px'
  },
  headerStats: { display: 'flex', gap: 28, alignItems: 'center' },
  signOutBtn: {
    background: 'transparent', color: 'var(--muted)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
    padding: '6px 14px', fontSize: 12, cursor: 'pointer',
  },
  submitBtn2: {
    background: 'transparent', color: 'var(--neon)',
    border: '1px solid rgba(200,255,0,0.4)', borderRadius: 6,
    padding: '6px 14px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
  },
  pendingBtn: {
    background: 'transparent', color: 'var(--light)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
    padding: '6px 14px', fontSize: 12, display: 'flex', alignItems: 'center',
  },
  signInBtn: {
    background: 'var(--neon)', color: 'var(--navy)',
    fontWeight: 700, fontSize: 12, padding: '7px 16px',
    borderRadius: 6, whiteSpace: 'nowrap',
  },
  topBanner: {
    display: 'flex', gap: 12, padding: '14px 24px',
    overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  topCard: {
    background: 'var(--card)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '10px 16px', minWidth: 160, flexShrink: 0,
  },
  noticeBanner: {
    background: 'rgba(200,255,0,0.05)',
    borderBottom: '1px solid rgba(200,255,0,0.1)',
    padding: '10px 24px', fontSize: 13, color: 'var(--light)',
  },
  toolbar: {
    padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center',
    background: '#0f1e38', borderBottom: '1px solid rgba(255,255,255,0.04)',
    flexWrap: 'wrap',
  },
}
// Note: submit button and pending link added via header update below
