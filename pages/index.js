import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

export default function Home() {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [events, setEvents]   = useState([])
  const [stats, setStats]     = useState({ posts: 0, reactions: 0, comments: 0, reposts: 0 })
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        const admin = session.user.email === ADMIN_EMAIL
        setIsAdmin(admin)
        if (admin) fetchPendingCount()
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) {
        setUser(session.user)
        const admin = session.user.email === ADMIN_EMAIL
        setIsAdmin(admin)
        if (admin) fetchPendingCount()
      } else {
        setUser(null)
        setIsAdmin(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => { fetchEvents() }, [])

  async function fetchEvents() {
    setLoading(true)
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .order('event_date', { ascending: false })

    const { data: postsData } = await supabase
      .from('posts')
      .select('event_id, reactions, comments, reposts')

    if (eventsData && postsData) {
      // Attach post stats to each event
      const enriched = eventsData.map(ev => {
        const evPosts = postsData.filter(p => p.event_id === ev.id)
        return {
          ...ev,
          post_count: evPosts.length,
          total_reactions: evPosts.reduce((s, p) => s + (p.reactions || 0), 0),
          total_comments: evPosts.reduce((s, p) => s + (p.comments || 0), 0),
          total_reposts: evPosts.reduce((s, p) => s + (p.reposts || 0), 0),
        }
      })
      setEvents(enriched)

      // Platform-wide totals
      setStats({
        posts: postsData.length,
        reactions: postsData.reduce((s, p) => s + (p.reactions || 0), 0),
        comments: postsData.reduce((s, p) => s + (p.comments || 0), 0),
        reposts: postsData.reduce((s, p) => s + (p.reposts || 0), 0),
      })
    }
    setLoading(false)
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
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
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
          <a href="/" style={styles.navLink}>Events</a>
          <a href="/search" style={styles.navLink}>AI Search</a>
          <a href="/reports" style={styles.navLink}>Reports</a>
          {isAdmin && (
            <a href="/Admin/pending" style={styles.navLink}>
              Pending {pendingCount > 0 && <span style={styles.badge}>{pendingCount}</span>}
            </a>
          )}
        </nav>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/submit" style={styles.submitBtn}>+ Submit Post</a>
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

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroEyebrow}>Creator Economy Event Intelligence</div>
          <h1 style={styles.heroTitle}>
            Every post.<br />Every event.<br />Every insight.
          </h1>
          <p style={styles.heroSub}>
            Track LinkedIn coverage across creator economy events. Understand what resonates, who drives reach, and where the industry is heading.
          </p>
          <div style={styles.heroCta}>
            <a href="/search" style={styles.ctaPrimary}>Try AI Search →</a>
            <a href="#events" style={styles.ctaSecondary}>Browse Events</a>
          </div>
        </div>

        {/* Platform stats */}
        <div style={styles.platformStats}>
          {[
            [stats.posts.toLocaleString(), 'Posts Tracked'],
            [stats.reactions.toLocaleString(), 'Total Reactions'],
            [stats.comments.toLocaleString(), 'Total Comments'],
            [events.length.toString(), 'Events Indexed'],
          ].map(([v, l]) => (
            <div key={l} style={styles.statCard}>
              <div style={styles.statVal}>{v}</div>
              <div style={styles.statLabel}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Event directory */}
      <div id="events" style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Events</h2>
          <p style={styles.sectionSub}>Click any event to explore its LinkedIn coverage</p>
        </div>

        <div style={styles.eventGrid}>
          {events.map(ev => (
            <a key={ev.id} href={`/events/${ev.slug}`} style={styles.eventCard}>
              <div style={styles.eventCardTop}>
                <div style={styles.eventCategory}>{ev.category}</div>
                <div style={styles.eventDate}>
                  {ev.event_date ? new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                </div>
              </div>
              <div style={styles.eventName}>{ev.name}</div>
              <div style={styles.eventMeta}>
                {ev.organizer && <span>{ev.organizer}</span>}
                {ev.location && <span> · {ev.location}</span>}
              </div>
              <div style={styles.eventStats}>
                <span style={styles.eventStat}><span style={{ color: 'var(--neon)', fontWeight: 700 }}>{ev.post_count}</span> posts</span>
                <span style={styles.eventStat}><span style={{ color: 'var(--neon)', fontWeight: 700 }}>{ev.total_reactions?.toLocaleString()}</span> reactions</span>
                <span style={styles.eventStat}><span style={{ color: 'var(--teal)', fontWeight: 700 }}>{ev.total_comments}</span> comments</span>
              </div>
              <div style={styles.eventCardArrow}>View coverage →</div>
            </a>
          ))}

          {/* Coming soon cards */}
          {['New Media Summit', 'Newsletter Conference', 'Craft & Commerce'].map(name => (
            <div key={name} style={{ ...styles.eventCard, opacity: 0.45, cursor: 'default' }}>
              <div style={styles.eventCardTop}>
                <div style={styles.eventCategory}>Creator Economy</div>
                <div style={{ ...styles.eventDate, background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>Coming Soon</div>
              </div>
              <div style={styles.eventName}>{name}</div>
              <div style={styles.eventMeta}>Data being collected</div>
              <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>Posts being indexed…</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 16, color: 'var(--neon)', fontStyle: 'italic' }}>Fruitful Intelligence</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>A Fruitful Events product · fruitful.events</div>
      </footer>
    </div>
  )
}

const styles = {
  header: {
    background: 'rgba(11,22,40,0.95)', backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(200,255,0,0.1)',
    padding: '0 32px', height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 20, fontWeight: 600, textDecoration: 'none' },
  nav: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: { color: 'var(--muted)', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 },
  badge: { background: '#ff5566', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 },
  submitBtn: { background: 'transparent', color: 'var(--neon)', border: '1px solid rgba(200,255,0,0.4)', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600 },
  signOutBtn: { background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  signInBtn: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 12, padding: '7px 16px', borderRadius: 6 },
  hero: {
    padding: '80px 32px 60px',
    background: 'linear-gradient(180deg, rgba(200,255,0,0.04) 0%, transparent 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  heroInner: { maxWidth: 700, marginBottom: 48 },
  heroEyebrow: { fontSize: 12, color: 'var(--neon)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, marginBottom: 16 },
  heroTitle: { fontFamily: 'DM Serif Display, serif', fontSize: 64, lineHeight: 1.05, color: 'var(--white)', marginBottom: 20, fontStyle: 'italic' },
  heroSub: { fontSize: 18, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 520, marginBottom: 32 },
  heroCta: { display: 'flex', gap: 12 },
  ctaPrimary: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 8 },
  ctaSecondary: { background: 'transparent', color: 'var(--white)', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 500, fontSize: 15, padding: '12px 28px', borderRadius: 8 },
  platformStats: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  statCard: { background: 'var(--card)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 24px', minWidth: 130 },
  statVal: { fontFamily: 'DM Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--neon)' },
  statLabel: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 4 },
  section: { padding: '60px 32px', maxWidth: 1200, margin: '0 auto' },
  sectionHeader: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'DM Serif Display, serif', fontSize: 36, fontStyle: 'italic', color: 'var(--white)', marginBottom: 6 },
  sectionSub: { color: 'var(--muted)', fontSize: 14 },
  eventGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  eventCard: {
    background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12, padding: 24, textDecoration: 'none', display: 'block',
    transition: 'border-color 0.15s, transform 0.15s',
    cursor: 'pointer',
  },
  eventCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  eventCategory: { fontSize: 10, color: 'var(--neon)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
  eventDate: { fontSize: 12, color: 'var(--muted)' },
  eventName: { fontFamily: 'DM Serif Display, serif', fontSize: 22, fontStyle: 'italic', color: 'var(--white)', marginBottom: 6 },
  eventMeta: { fontSize: 12, color: 'var(--muted)', marginBottom: 16 },
  eventStats: { display: 'flex', gap: 16, marginBottom: 16 },
  eventStat: { fontSize: 13, color: 'var(--light)' },
  eventCardArrow: { fontSize: 12, color: 'var(--neon)', fontWeight: 600 },
  footer: { borderTop: '1px solid rgba(255,255,255,0.06)', padding: '32px', textAlign: 'center', marginTop: 40 },
}
