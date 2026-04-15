import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../lib/scoring'
import { ScaleBar } from '../components/ScaleBar'

export default function Result() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    supabase.from('results').select('*, participants(first_name, last_name)').eq('id', id).single()
      .then(({ data }) => setData(data))
  }, [id])

  if (!data) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Yükleniyor...</p></div>

  const profile = getProfile(data.final_score)
  const ringOffset = 314 - (314 * ((data.final_score - 50) / 40))

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>UNIQ</div>
        <p style={styles.name}>{data.participants.first_name} {data.participants.last_name}</p>

        <div style={styles.ringWrap}>
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="58" fill="none" stroke="#1f1f1f" strokeWidth="8" />
            <circle cx="70" cy="70" r="58" fill="none" stroke="#C9A84C" strokeWidth="8"
              strokeDasharray="364" strokeDashoffset={ringOffset}
              strokeLinecap="round" transform="rotate(-90 70 70)" />
          </svg>
          <div style={styles.ringCenter}>
            <span style={styles.ringScore}>{data.final_score}</span>
            <span style={styles.ringLabel}>puan</span>
          </div>
        </div>

        <ScaleBar score={data.final_score} />

        <div style={styles.profileBadge}>{profile.name}</div>
        <p style={styles.profileSub}>{profile.sub}</p>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>KOÇLUK NOTU</p>
          <p style={styles.diagnosis}>{profile.diagnosis}</p>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>GRUP DAĞILIMI</p>
          <div style={styles.barBlock}>
            <span style={styles.barLabel}>Mekanik Refleks (Kurallara bağlılık)</span>
            <div style={styles.barRow}>
              <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${(data.group1_score / 40) * 100}%` }} /></div>
              <span style={styles.barVal}>{Math.round((data.group1_score / 40) * 100)}%</span>
            </div>
          </div>
          <div style={styles.barBlock}>
            <span style={styles.barLabel}>Donma Refleksi (Zor anlarda esneklik)</span>
            <div style={styles.barRow}>
              <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${(data.group2_score / 10) * 100}%`, background: '#8b6914' }} /></div>
              <span style={styles.barVal}>{Math.round((data.group2_score / 10) * 100)}%</span>
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>EĞİTİM ODAK NOKTALARI</p>
          <div style={styles.tags}>
            {profile.focus.map(f => <span key={f} style={styles.tag}>{f}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '30px 20px' },
  card: { width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' },
  logo: { fontSize: '13px', fontWeight: '500', color: '#C9A84C', letterSpacing: '2px' },
  name: { fontSize: '20px', fontWeight: '500', color: '#fff' },
  ringWrap: { position: 'relative', width: '140px', height: '140px', alignSelf: 'center' },
  ringCenter: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', display: 'flex', flexDirection: 'column' },
  ringScore: { fontSize: '32px', fontWeight: '600', color: '#C9A84C' },
  ringLabel: { fontSize: '11px', color: '#555' },
  profileBadge: { alignSelf: 'center', background: '#1a1600', border: '1px solid #C9A84C44', borderRadius: '20px', padding: '6px 20px', fontSize: '14px', color: '#C9A84C' },
  profileSub: { textAlign: 'center', fontSize: '12px', color: '#9a9a9a', lineHeight: 1.4 },
  section: { background: '#111', borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '11px', color: '#555', letterSpacing: '1px' },
  diagnosis: { fontSize: '13px', color: '#aaa', lineHeight: '1.7' },
  barBlock: { display: 'flex', flexDirection: 'column', gap: '8px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  barLabel: { fontSize: '11px', color: '#888', lineHeight: 1.35 },
  barTrack: { flex: 1, height: '6px', background: '#1f1f1f', borderRadius: '3px', overflow: 'hidden', minWidth: 0 },
  barFill: { height: '100%', background: '#C9A84C', borderRadius: '3px' },
  barVal: { fontSize: '11px', color: '#666', minWidth: '40px', textAlign: 'right', flexShrink: 0 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', color: '#bbb' }
}
