import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Account created! Check your email to confirm, then log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/'
    }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={{ color: 'var(--neon)', fontFamily: 'DM Serif Display, serif', fontSize: 28, fontStyle: 'italic' }}>Scalable</span>
          <span style={{ color: 'var(--white)', fontFamily: 'DM Serif Display, serif', fontSize: 28 }}> Summit</span>
        </div>
        <p style={styles.sub}>2026 Post Tracker — {isSignup ? 'Create your account' : 'Sign in to your account'}</p>

        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          {' '}
          <button onClick={() => { setIsSignup(!isSignup); setError(null); setMessage(null) }} style={styles.link}>
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--navy)',
    padding: 24,
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
  },
  logo: { textAlign: 'center', marginBottom: 6 },
  sub: { textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
  btn: {
    background: 'var(--neon)',
    color: 'var(--navy)',
    fontWeight: 700,
    fontSize: 15,
    padding: '12px 0',
    borderRadius: 8,
    marginTop: 4,
  },
  toggle: { textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 },
  link: { background: 'none', color: 'var(--neon)', fontWeight: 600, fontSize: 13, textDecoration: 'underline' },
  error: { background: 'rgba(255,85,102,0.1)', border: '1px solid rgba(255,85,102,0.3)', borderRadius: 6, padding: '10px 14px', color: '#ff5566', fontSize: 13, marginBottom: 16 },
  success: { background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', borderRadius: 6, padding: '10px 14px', color: 'var(--green)', fontSize: 13, marginBottom: 16 },
}
