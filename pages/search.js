import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const SUGGESTED = [
  "Which post generated the most engagement and why?",
  "What posting frameworks drove the highest reach at Scalable Summit?",
  "Which sponsors got the most organic coverage and what does that tell us about event ROI?",
  "Who are the top 5 most influential attendees by total engagement?",
  "What were the most common themes and why do they resonate with creator economy audiences?",
  "How does beehiiv's presence at Scalable Summit compare to its broader market position?",
  "What would you recommend to a first-time event sponsor based on this data?",
  "Which attendees showed the strongest signs of being future thought leaders?",
]

export default function Search() {
  const [user, setUser]       = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [posts, setPosts]     = useState([])
  const [events, setEvents]   = useState([])
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); setIsAdmin(session.user.email === ADMIN_EMAIL) }
    })
    fetchData()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchData() {
    setDataLoading(true)
    const [{ data: postsData }, { data: eventsData }] = await Promise.all([
      supabase.from('posts').select('first_name, last_name, company, title, post_summary, tagged_people, reactions, comments, reposts, post_link, event_id'),
      supabase.from('events').select('id, name, slug, event_date, location, organizer'),
    ])
    setPosts(postsData || [])
    setEvents(eventsData || [])
    setDataLoading(false)
  }

  async function handleSend(questionOverride) {
    const question = questionOverride || input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      // Build structured context to pass to the API
      const eventMap = Object.fromEntries(events.map(e => [e.id, e.name]))
      const context = posts.map(p => ({
        name: `${p.first_name} ${p.last_name}`,
        company: p.company,
        title: p.title,
        event: eventMap[p.event_id] || 'Unknown Event',
        summary: p.post_summary,
        tagged: p.tagged_people,
        reactions: p.reactions,
        comments: p.comments,
        reposts: p.reposts,
        post_link: p.post_link,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, posts: context, events }),
      })

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', isError: true }])
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null); setIsAdmin(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/" style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontStyle: 'italic' }}>Fruitful</span>
          <span style={{ fontFamily: 'DM Serif Display, serif' }}> Intelligence</span>
        </a>
        <nav style={styles.nav}>
          <a href="/" style={styles.navLink}>← Events</a>
          <a href="/search" style={{ ...styles.navLink, color: 'var(--neon)' }}>AI Search</a>
          <a href="/reports" style={styles.navLink}>Reports</a>
        </nav>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 800, margin: '0 auto', width: '100%', padding: '0 24px' }}>

        {/* Title */}
        <div style={{ padding: '40px 0 24px' }}>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, fontStyle: 'italic', color: 'var(--white)', marginBottom: 8 }}>
            AI Search
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Ask anything about the {posts.length} posts across {events.length} tracked events.
            {dataLoading && ' Loading data…'}
          </p>
        </div>

        {/* Suggested questions — only shown when no messages */}
        {messages.length === 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Try asking</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => handleSend(q)}
                  style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '10px 16px', color: 'var(--light)', fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                background: msg.role === 'user' ? 'var(--neon)' : 'var(--card)',
                color: msg.role === 'user' ? 'var(--navy)' : 'var(--white)',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '12px 16px',
                fontSize: 14,
                lineHeight: 1.6,
                fontWeight: msg.role === 'user' ? 600 : 400,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ background: 'var(--card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px 12px 12px 2px', padding: '12px 16px', color: 'var(--muted)', fontSize: 14 }}>
                Analyzing data…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--navy)', paddingBottom: 24, paddingTop: 12 }}>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, display: 'block' }}>
              Clear conversation
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask anything about the data…"
              disabled={loading || dataLoading}
              style={{ flex: 1, background: 'var(--card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'var(--white)', fontFamily: 'Outfit, sans-serif', fontSize: 14, padding: '12px 16px', outline: 'none' }}
            />
            <button onClick={() => handleSend()} disabled={loading || !input.trim() || dataLoading}
              style={{ background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 14, padding: '12px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: { background: 'rgba(11,22,40,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(200,255,0,0.1)', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 },
  logo: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 20, fontWeight: 600, textDecoration: 'none' },
  nav: { display: 'flex', gap: 28, alignItems: 'center' },
  navLink: { color: 'var(--muted)', fontSize: 14, textDecoration: 'none' },
  signOutBtn: { background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  signInBtn: { background: 'var(--neon)', color: 'var(--navy)', fontWeight: 700, fontSize: 12, padding: '7px 16px', borderRadius: 6 },
}
