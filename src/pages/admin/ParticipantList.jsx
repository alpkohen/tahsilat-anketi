import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getProfile } from '../../lib/scoring'

const GOLD = '#C9A84C'
const BG = '#0D0D0D'

export default function ParticipantList() {
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [groups, setGroups] = useState([])
  const [filterGroupId, setFilterGroupId] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/admin')
        return
      }
      const { data: pData } = await supabase
        .from('participants')
        .select('*, survey_groups(name), results(id, final_score, profile)')
        .order('created_at', { ascending: false })
      setParticipants(pData || [])
      const { data: gData } = await supabase.from('survey_groups').select('*').order('name')
      setGroups(gData || [])
    })()
  }, [navigate])

  const filtered = filterGroupId
    ? participants.filter((p) => String(p.group_id) === filterGroupId)
    : participants

  return (
    <div style={{ ...styles.container, background: BG }}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <button type="button" style={styles.back} onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          <span style={styles.logo}>UNIQ Admin</span>
        </div>
        <h2 style={styles.title}>Tüm katılımcılar</h2>
        <p style={styles.lead}>Grup seçerek filtreleyin; satıra tıklayınca detay açılır.</p>

        <select
          style={styles.select}
          value={filterGroupId}
          onChange={(e) => setFilterGroupId(e.target.value)}
        >
          <option value="">Tüm gruplar</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>

        <div style={styles.list}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{ ...styles.row, opacity: p.results?.[0] ? 1 : 0.5 }}
              onClick={() => {
                const resultId = p.results?.[0]?.id
                if (resultId) {
                  const q = p.group_id ? `?group=${p.group_id}` : ''
                  navigate(`/admin/participant/${resultId}${q}`)
                }
              }}
            >
              <div>
                <p style={styles.name}>{p.first_name} {p.last_name}</p>
                <p style={styles.sub}>
                  {p.survey_groups?.name}
                  {p.department ? ` · ${p.department}` : ''}
                </p>
              </div>
              <div style={styles.right}>
                {p.results?.[0] && (
                  <>
                    <span style={styles.score}>{p.results[0].final_score}</span>
                    <span style={styles.profile}>{getProfile(p.results[0].final_score).name}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', padding: '24px 20px' },
  inner: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  back: { background: 'transparent', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer' },
  logo: { fontSize: '13px', fontWeight: '500', color: GOLD, letterSpacing: '2px' },
  title: { fontSize: '22px', fontWeight: '600', color: '#fff' },
  lead: { fontSize: '13px', color: '#666', lineHeight: 1.5 },
  select: {
    height: '48px',
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '0 14px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    width: '100%'
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: {
    background: '#111',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer'
  },
  name: { fontSize: '15px', color: '#e0e0e0', fontWeight: '500' },
  sub: { fontSize: '12px', color: '#555', marginTop: '2px' },
  right: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  score: { fontSize: '20px', fontWeight: '600', color: GOLD },
  profile: { fontSize: '11px', color: '#888' }
}
