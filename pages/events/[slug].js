import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import AdminTable from '../../components/AdminTable'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function EventPage() {
  const router = useRouter()
  const { slug } = router.query

  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [event, setEvent]     = useState(null)
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState('reactions-desc')
  const [toast, setToast]     = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        setIsAdmin(session.user.email === ADMIN_EMAIL)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) { setUser(session.user); setIsAdmin(session.user.email === ADMIN_EMAIL) }
      else { setUser(null); setIsAdmin(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!slug) return
    fetchEvent()
  }, [slug])

  async function fetchEvent() {
    setLoading(true)
    const { data: ev } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!ev) { router.push('/'); return }
    setEvent(ev)

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('event_id', ev.id)
      .order('reactions', { ascending: false })

    setPosts(postsData || [])
    setLoading(false)
  }

  async function handleSave(id, updates) {
    const { error } = await supabase.from('posts').update(updates).eq('id', id)
    if (error) { showToast('Error: ' + error.message, true); return }
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    showToast('✓ Saved')
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null); setIsAdmin(false)
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
    const va = a[field] || 0, vb = b[field] || 0
    if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return dir === 'asc' ? va - vb : vb - va
  })

  const totals = {
    reactions: posts.reduce((s, p) => s + (p.reactions || 0), 0),
    comments: posts.reduce((s, p) => s + (p.comments || 0), 0),
    reposts: posts.reduce((s, p) => s + (p.reposts || 0), 0),
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

      {/* Header */}
      <header style={styles.header}>
        <a href="/" style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>Fruitful</span>
          <span style={{ fontFamily: 'DM Serif Display, serif' }}> Intelligence</span>
        </a>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>← All Events</a>
          <a href="/search" style={styles.navLink}>AI Search</a>
          <a href="/reports" style={styles.navLink}>Reports</a>
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href={`/submit?event=${slug}`} style={styles.submitBtn}>+ Submit Post</a>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</span>
              <button onClick={handleSignOut} style={styles.signOutBtn}>Sign out</button>
            </>
          ) : (
            <a href="/login" style={styles.signInBtn}>Sign in</a>
          )}
        </div>
      </header>

      {/* Event hero */}
      <div style={styles.eventHero}>
        <div style={styles.breadcrumb}>
          <a href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Events</a>
          <span style={{ color: 'var(--muted)', margin: '0 8px' }}>→</span>
          <span style={{ color: 'var(--white)' }}>{event?.name}</span>
        </div>
        <h1 style={styles.eventTitle}>{event?.name}</h1>
        <div style={styles.eventMeta}>
          {event?.organizer && <span>{event.organizer}</span>}
          {event?.location && <span> · {event.location}</span>}
          {event?.event_date && <span> · {new Date(event.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            [posts.length, 'Posts'],
            [totals.reactions.toLocaleString(), 'Reactions'],
            [totals.comments, 'Comments'],
            [totals.reposts, 'Reposts'],
          ].map(([v, l]) => (
            <div key={l} style={styles.statCard}>
              <div style={styles.statVal}>{v}</div>
              <div style={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 */}
      <div style={styles.topBanner}>
        {[...posts].sort((a,b) => b.reactions - a.reactions).slice(0,5).map((p, i) => (
          <div key={p.id} style={styles.topCard}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>#{i+1} reactions</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 20, fontWeight: 700, color: 'var(--neon)' }}>{p.reactions}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.comments} comments · {p.reposts} reposts</div>
          </div>
        ))}
      </div>

      {/* Notice */}
      {!user && (
        <div style={styles.noticeBanner}>
          👀 Viewing all posts. <a href="/login" style={{ color: 'var(--neon)', marginLeft: 6 }}>Sign in to edit your post →</a>
        </div>
      )}
      {user && !isAdmin && posts.some(p => p.owner_email?.toLowerCase() === user?.email?.toLowerCase()) && (
        <div style={styles.noticeBanner}>
          <span style={{ color: 'var(--neon)' }}>✏ Your row is highlighted — click Edit to update it.</span>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
          <input type="search" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, company, summary…"
            style={{ paddingLeft: 32, background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', width: '100%', borderRadius: 6, color: 'var(--white)', fontFamily: 'Outfit, sans-serif', fontSize: 13, padding: '8px 12px 8px 32px', outline: 'none' }} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: 'var(--white)', fontFamily: 'Outfit, sans-serif', fontSize: 13, padding: '8px 10px', outline: 'none' }}>
          <option value="reactions-desc">↓ Reactions</option>
          <option value="reactions-asc">↑ Reactions</option>
          <option value="comments-desc">↓ Comments</option>
          <option value="reposts-desc">↓ Reposts</option>
          <option value="name-asc">A–Z Name</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>{sorted.length} of {posts.length} posts</span>
      </div>

      <AdminTable posts={sorted} onSave={handleSave} currentUserEmail={user?.email || null} isAdmin={isAdmin} />
    </div>
  )
}

const styles = {
  header: { background: 'rgba(11,22,40,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(200,255,0,0.1)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 20, fontWeight: 600, textDecoration: 'none' },
  nav: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: { color: 'var(--muted)', fontSize: 14, textDecoration: 'none' },
  submitBtn: { background: 'transparent', color: 'var(--neon)', border: '1px solid rgba(200,255,0,0.4)', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600 },
  signOutBtn: { background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  signInBtn: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 12, padding: '7px 16px', borderRadius: 6 },
  eventHero: { padding: '48px 32px 32px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'linear-gradient(180deg, rgba(200,255,0,0.03) 0%, transparent 100%)' },
  breadcrumb: { fontSize: 12, marginBottom: 16 },
  eventTitle: { fontFamily: 'DM Serif Display, serif', fontSize: 48, fontStyle: 'italic', color: 'var(--white)', marginBottom: 8 },
  eventMeta: { fontSize: 14, color: 'var(--muted)', marginBottom: 28 },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  statCard: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 22px', minWidth: 110 },
  statVal: { fontFamily: 'DM Mono, monospace', fontSize: 26, fontWeight: 700, color: 'var(--neon)' },
  statLabel: { fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 3 },
  topBanner: { display: 'flex', gap: 12, padding: '14px 32px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  topCard: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', minWidth: 160, flexShrink: 0 },
  noticeBanner: { background: 'rgba(200,255,0,0.05)', borderBottom: '1px solid rgba(200,255,0,0.1)', padding: '10px 32px', fontSize: 13, color: 'var(--light)' },
  toolbar: { padding: '12px 32px', display: 'flex', gap: 12, alignItems: 'center', background: '#0f1e38', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' },
}
