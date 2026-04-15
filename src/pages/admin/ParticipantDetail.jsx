import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import { getProfile } from '../../lib/scoring'
import { ScaleBar } from '../../components/ScaleBar'

const Q_LABELS = ['', 'Teknik sorulara geç', 'Tutarı direkt söyle', 'Avukata ver direnci', 'Otoriter prosedür', 'İşsize yaklaşım', 'Sertleşince sertleş', '90. gün direnci', 'Yasal prosedür itirazı', 'Ben çok konuşurum', 'Mahcup olurum direnci']

const GOLD = '#C9A84C'
const BG = '#0D0D0D'
const CARD = '#111'

function avg(nums) {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export default function ParticipantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupFromQuery = searchParams.get('group')

  const [data, setData] = useState(null)
  const [groupAvgFinal, setGroupAvgFinal] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/admin')
        return
      }
      const { data: d } = await supabase
        .from('results')
        .select('*, participants(first_name, last_name, department, group_id, survey_groups(name))')
        .eq('id', id)
        .single()
      if (!cancelled) setData(d)
    })()
    return () => { cancelled = true }
  }, [id, navigate])

  const groupId = data?.participants?.group_id

  useEffect(() => {
    if (!groupId || !data) return
    let cancelled = false
    ;(async () => {
      const { data: parts } = await supabase.from('participants').select('id').eq('group_id', groupId)
      if (cancelled || !parts?.length) {
        if (!cancelled) setGroupAvgFinal(null)
        return
      }
      const pids = parts.map((p) => p.id)
      const { data: results } = await supabase.from('results').select('id, final_score').in('participant_id', pids)
      if (cancelled) return
      const scores = (results || []).map((r) => r.final_score).filter((n) => typeof n === 'number')
      setGroupAvgFinal(scores.length ? avg(scores) : null)
    })()
    return () => { cancelled = true }
  }, [groupId, data?.id])

  const compareData = useMemo(() => {
    if (data == null || groupAvgFinal == null) return null
    return [
      { name: 'Senin puanın', value: data.final_score },
      { name: 'Grup ortalaması', value: Math.round(groupAvgFinal * 10) / 10 }
    ]
  }, [data, groupAvgFinal])

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Yükleniyor…</p>
      </div>
    )
  }

  const profile = getProfile(data.final_score)
  const p = data.participants
  const dashboardGroup = groupFromQuery || groupId

  const goDashboard = () => {
    if (dashboardGroup) navigate(`/admin/dashboard?group=${dashboardGroup}`)
    else navigate('/admin/dashboard')
  }

  const diff = groupAvgFinal != null ? data.final_score - groupAvgFinal : null

  return (
    <div style={{ ...styles.container, background: BG }}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <button type="button" style={styles.back} onClick={goDashboard}>← Gruba Dön</button>
          <span style={styles.logo}>UNIQ Admin</span>
        </div>

        <div style={styles.topCard}>
          <div style={styles.topCardRow}>
            <div>
              <p style={styles.name}>{p.first_name} {p.last_name}</p>
              <p style={styles.sub}>
                {p.survey_groups?.name}
                {p.department ? ` · ${p.department}` : ''}
              </p>
            </div>
            <div style={styles.scoreWrap}>
              <span style={styles.score}>{data.final_score}</span>
              <span style={styles.profileBadge}>{profile.name}</span>
            </div>
          </div>
          <ScaleBar score={data.final_score} />
        </div>

        {compareData && (
          <div style={styles.section}>
            <p style={styles.sectionTitle}>GRUP İLE KARŞILAŞTIRMA (FİNAL PUAN)</p>
            {diff != null && (
              <p style={styles.diffHint}>
                Grup ortalamasına göre:{' '}
                <span style={{ color: GOLD }}>
                  {diff > 0 ? '+' : ''}{diff.toFixed(1)} puan
                </span>
              </p>
            )}
            <div style={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={compareData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis type="number" domain={[50, 100]} tick={{ fill: '#888', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#888', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: CARD, border: '1px solid #2a2a2a', borderRadius: '8px', color: '#e0e0e0' }}
                    formatter={(v) => [typeof v === 'number' ? v.toFixed(1) : v, 'Puan']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {compareData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? GOLD : '#5a4a2a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

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
          <p style={styles.sectionTitle}>SORU BAZLI YANITLAR</p>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} style={styles.qRow}>
              <span style={styles.qLabel}>S{n}: {Q_LABELS[n]}</span>
              <div style={styles.dots}>
                {[1, 2, 3, 4, 5].map((d) => (
                  <div key={d} style={{ ...styles.dot, ...(data[`q${n}`] === d ? styles.dotFilled : {}) }} />
                ))}
              </div>
              <span style={styles.qVal}>{data[`q${n}`]}</span>
            </div>
          ))}
        </div>

        <button type="button" style={styles.footerBtn} onClick={goDashboard}>← Gruba Dön</button>
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
  topCard: { background: CARD, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '4px' },
  topCardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' },
  name: { fontSize: '18px', fontWeight: '500', color: '#fff' },
  sub: { fontSize: '12px', color: '#555', marginTop: '2px' },
  scoreWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
  score: { fontSize: '32px', fontWeight: '600', color: GOLD },
  profileBadge: { background: '#1a1600', border: '1px solid #C9A84C44', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', color: GOLD },
  section: { background: CARD, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  sectionTitle: { fontSize: '11px', color: '#555', letterSpacing: '1px' },
  diffHint: { fontSize: '13px', color: '#888' },
  chartWrap: { width: '100%', minHeight: 200 },
  diagnosis: { fontSize: '13px', color: '#aaa', lineHeight: '1.7' },
  barBlock: { display: 'flex', flexDirection: 'column', gap: '8px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  barLabel: { fontSize: '11px', color: '#888', lineHeight: 1.35 },
  barTrack: { flex: 1, height: '6px', background: '#1f1f1f', borderRadius: '3px', overflow: 'hidden', minWidth: 0 },
  barFill: { height: '100%', background: GOLD, borderRadius: '3px' },
  barVal: { fontSize: '11px', color: '#666', minWidth: '40px', textAlign: 'right', flexShrink: 0 },
  qRow: { display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #1a1a1a' },
  qLabel: { fontSize: '11px', color: '#888', flex: 1 },
  dots: { display: 'flex', gap: '4px' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', background: '#1f1f1f', border: '1px solid #2a2a2a' },
  dotFilled: { background: GOLD, border: `1px solid ${GOLD}` },
  qVal: { fontSize: '13px', color: GOLD, width: '16px', textAlign: 'right' },
  footerBtn: {
    width: '100%',
    height: '48px',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    color: GOLD,
    fontSize: '14px',
    cursor: 'pointer'
  }
}
