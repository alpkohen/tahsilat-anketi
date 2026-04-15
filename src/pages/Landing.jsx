import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Landing() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.from('survey_groups').select('*').eq('slug', slug).single()
      .then(({ data, error }) => {
        if (error || !data) setError(true)
        else setGroup(data)
      })
  }, [slug])

  if (error) return (
    <div style={styles.center}>
      <p style={styles.errorText}>Geçersiz anket linki.</p>
    </div>
  )

  if (!group) return (
    <div style={styles.center}>
      <p style={{ color: '#666' }}>Yükleniyor...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>UNIQ</div>
        <h1 style={styles.title}>Tahsilat Uzmanı<br />Profil Analizi</h1>
        <p style={styles.group}>{group.name}</p>
        <p style={styles.desc}>
          Bu anket, tahsilat görüşmelerindeki doğal reflekslerinizi anlamak için tasarlanmıştır.
          10 kısa soru, yaklaşık 3 dakika.
        </p>
        <div style={styles.infoBox}>
          <div style={styles.infoItem}><span style={styles.infoNum}>10</span><span style={styles.infoLabel}>Soru</span></div>
          <div style={styles.divider} />
          <div style={styles.infoItem}><span style={styles.infoNum}>3</span><span style={styles.infoLabel}>Dakika</span></div>
          <div style={styles.divider} />
          <div style={styles.infoItem}><span style={styles.infoNum}>1</span><span style={styles.infoLabel}>Profil</span></div>
        </div>
        <button style={styles.btn} onClick={() => navigate(`/s/${slug}/info`)}>
          Başla →
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' },
  logo: { fontSize: '13px', fontWeight: '500', color: '#C9A84C', letterSpacing: '2px' },
  title: { fontSize: '28px', fontWeight: '600', color: '#fff', lineHeight: '1.3' },
  group: { fontSize: '13px', color: '#C9A84C', background: '#1a1600', border: '1px solid #C9A84C44', borderRadius: '20px', padding: '4px 14px', display: 'inline-block', width: 'fit-content' },
  desc: { fontSize: '14px', color: '#888', lineHeight: '1.7' },
  infoBox: { display: 'flex', background: '#111', borderRadius: '14px', padding: '16px', justifyContent: 'space-around', alignItems: 'center' },
  infoItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  infoNum: { fontSize: '22px', fontWeight: '600', color: '#C9A84C' },
  infoLabel: { fontSize: '11px', color: '#555' },
  divider: { width: '1px', height: '30px', background: '#1f1f1f' },
  btn: { width: '100%', height: '54px', background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  errorText: { color: '#ff6b6b' }
}
