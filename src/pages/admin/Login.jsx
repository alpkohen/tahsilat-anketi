import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Giriş başarısız. Email veya şifre hatalı.'); setLoading(false) }
    else navigate('/admin/dashboard')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>UNIQ</div>
        <h2 style={styles.title}>Admin Girişi</h2>
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={styles.input} type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {error && <p style={styles.error}>{error}</p>}
        <button style={styles.btn} onClick={handleLogin} disabled={loading}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' },
  logo: { fontSize: '13px', fontWeight: '500', color: '#C9A84C', letterSpacing: '2px' },
  title: { fontSize: '24px', fontWeight: '600', color: '#fff' },
  input: { height: '50px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '0 16px', color: '#fff', fontSize: '15px', outline: 'none' },
  btn: { height: '54px', background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  error: { color: '#ff6b6b', fontSize: '13px' }
}
