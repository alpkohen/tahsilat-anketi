import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function ParticipantInfo() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', department: '' })
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    sessionStorage.setItem('participant', JSON.stringify(form))
    navigate(`/s/${slug}/survey`)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>UNIQ</div>
        <h2 style={styles.title}>Bilgilerinizi girin</h2>
        <p style={styles.desc}>Sonuçlarınız adınızla kaydedilecek.</p>

        <div style={styles.field}>
          <label style={styles.label}>Ad *</label>
          <input style={styles.input} placeholder="Ahmet" value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Soyad *</label>
          <input style={styles.input} placeholder="Yılmaz" value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Departman / Şube <span style={{ color: '#555' }}>(opsiyonel)</span></label>
          <input style={styles.input} placeholder="Bireysel Bankacılık" value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })} />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.btn} onClick={handleSubmit}>Ankete Geç →</button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' },
  logo: { fontSize: '13px', fontWeight: '500', color: '#C9A84C', letterSpacing: '2px' },
  title: { fontSize: '24px', fontWeight: '600', color: '#fff' },
  desc: { fontSize: '14px', color: '#666' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', color: '#888' },
  input: { height: '50px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '0 16px', color: '#fff', fontSize: '15px', outline: 'none' },
  btn: { width: '100%', height: '54px', background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  error: { color: '#ff6b6b', fontSize: '13px' }
}
