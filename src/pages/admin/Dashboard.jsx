import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { supabase } from '../../lib/supabase'

const PROFILE_ORDER = ['Sorgu Hakimi', 'Empatik Dinleyici', 'Müzakere Stratejisti']
const GOLD = '#C9A84C'
const BG = '#0D0D0D'
const CARD = '#111'

function median(nums) {
  if (!nums.length) return null
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function avg(nums) {
  if (!nums.length) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function QuestionAvgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const raw = payload[0]?.value
  const v = typeof raw === 'number' ? raw : Number(raw)
  const text = Number.isFinite(v) ? v.toFixed(2) : '—'
  return (
    <div
      style={{
        background: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#C9A84C'
      }}
    >
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#C9A84C' }}>
        Ortalama: {text}
      </div>
      {label != null && label !== '' && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>{label}</div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedGroupId = searchParams.get('group') || ''

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  useEffect(() => {
    supabase.from('survey_groups').select('*').order('created_at', { ascending: false }).then(({ data }) => setGroups(data || []))
  }, [])

  useEffect(() => {
    if (!selectedGroupId) {
      setRows([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const { data: parts } = await supabase.from('participants').select('id, first_name, last_name, group_id').eq('group_id', selectedGroupId)
      if (cancelled) return
      if (!parts?.length) {
        setRows([])
        setLoading(false)
        return
      }
      const pids = parts.map((p) => p.id)
      const byPid = Object.fromEntries(parts.map((p) => [p.id, p]))
      const { data: results } = await supabase.from('results').select('*').in('participant_id', pids)
      if (cancelled) return
      const merged = (results || []).map((r) => ({
        ...r,
        participant: byPid[r.participant_id]
      }))
      setRows(merged)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [selectedGroupId])

  const analytics = useMemo(() => {
    if (!rows.length) return null
    const finals = rows.map((r) => r.final_score).filter((n) => typeof n === 'number')
    const g1 = rows.map((r) => r.group1_score).filter((n) => typeof n === 'number')
    const g2 = rows.map((r) => r.group2_score).filter((n) => typeof n === 'number')
    const profileCounts = {}
    PROFILE_ORDER.forEach((p) => { profileCounts[p] = 0 })
    rows.forEach((r) => {
      if (r.profile && profileCounts[r.profile] !== undefined) profileCounts[r.profile] += 1
      else if (r.profile) profileCounts[r.profile] = (profileCounts[r.profile] || 0) + 1
    })
    const n = rows.length
    const questionAvgs = []
    for (let i = 1; i <= 10; i++) {
      const key = `q${i}`
      const vals = rows.map((r) => r[key]).filter((v) => typeof v === 'number')
      questionAvgs.push({
        q: `S${i}`,
        avg: vals.length ? avg(vals) : 0,
        n: vals.length
      })
    }
    return {
      count: n,
      avgFinal: finals.length ? avg(finals) : null,
      medianFinal: finals.length ? median(finals) : null,
      minFinal: finals.length ? Math.min(...finals) : null,
      maxFinal: finals.length ? Math.max(...finals) : null,
      avgG1: g1.length ? avg(g1) : null,
      avgG2: g2.length ? avg(g2) : null,
      profileCounts,
      profileRows: PROFILE_ORDER.map((name) => {
        const c = profileCounts[name] || 0
        return { name, count: c, pct: n ? Math.round((c / n) * 1000) / 10 : 0 }
      }),
      questionAvgs
    }
  }, [rows])

  const setGroupParam = (id) => {
    if (id) setSearchParams({ group: id })
    else setSearchParams({})
  }

  return (
    <div style={{ ...styles.container, background: BG }}>
      <div style={styles.inner}>
        <div style={styles.header}>
          <div style={styles.logo}>UNIQ Admin</div>
          <button type="button" style={styles.linkBtn} onClick={() => navigate('/admin/participants')}>Tüm katılımcılar →</button>
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>GRUP SEÇİMİ</p>
          <select
            style={styles.select}
            value={selectedGroupId}
            onChange={(e) => setGroupParam(e.target.value)}
          >
            <option value="">Grup seçin…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {selectedGroupId && loading && (
          <p style={{ color: '#666', fontSize: '14px' }}>Yükleniyor…</p>
        )}

        {selectedGroupId && !loading && analytics && (
          <>
            <div style={styles.statsGrid}>
              <div style={styles.statCard}><span style={styles.statNum}>{analytics.count}</span><span style={styles.statLabel}>Katılımcı</span></div>
              <div style={styles.statCard}><span style={styles.statNum}>{analytics.avgFinal != null ? analytics.avgFinal.toFixed(1) : '—'}</span><span style={styles.statLabel}>Ortalama puan</span></div>
              <div style={styles.statCard}><span style={styles.statNum}>{analytics.medianFinal != null ? analytics.medianFinal.toFixed(1) : '—'}</span><span style={styles.statLabel}>Medyan</span></div>
              <div style={styles.statCard}><span style={styles.statNum}>{analytics.minFinal ?? '—'}</span><span style={styles.statLabel}>En düşük</span></div>
              <div style={styles.statCard}><span style={styles.statNum}>{analytics.maxFinal ?? '—'}</span><span style={styles.statLabel}>En yüksek</span></div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>PROFİL DAĞILIMI</p>
              {analytics.profileRows.map((row) => (
                <div key={row.name} style={styles.profileBlock}>
                  <div style={styles.profileHead}>
                    <span style={styles.profileName}>{row.name}</span>
                    <span style={styles.profileMeta}>{row.count} kişi · %{row.pct}</span>
                  </div>
                  <div style={styles.track}>
                    <div style={{ ...styles.trackFill, width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.statsRow2}>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{analytics.avgG1 != null ? analytics.avgG1.toFixed(2) : '—'}</span>
                <span style={styles.statLabel}>Grup 1 — Mekanik Refleks (ort.)</span>
                <span style={styles.statHint}>max 40</span>
              </div>
              <div style={styles.statCard}>
                <span style={styles.statNum}>{analytics.avgG2 != null ? analytics.avgG2.toFixed(2) : '—'}</span>
                <span style={styles.statLabel}>Grup 2 — Donma Refleksi (ort.)</span>
                <span style={styles.statHint}>max 10</span>
              </div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>SORU BAZLI GRUP ORTALAMALARI (Likert 1–5)</p>
              <div style={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={analytics.questionAvgs} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="q" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis domain={[1, 5]} tick={{ fill: '#888', fontSize: 11 }} width={32} />
                    <Tooltip cursor={{ fill: '#1f1f1f' }} content={QuestionAvgTooltip} />
                    <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                      {analytics.questionAvgs.map((_, i) => (
                        <Cell key={i} fill={GOLD} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>BU GRUPTAKİ KATILIMCILAR</p>
              {rows.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  style={styles.participantRow}
                  onClick={() => navigate(`/admin/participant/${r.id}?group=${selectedGroupId}`)}
                >
                  <span style={styles.pName}>
                    {r.participant?.first_name} {r.participant?.last_name}
                  </span>
                  <span style={styles.pScore}>{r.final_score}</span>
                  <span style={styles.pProfile}>{r.profile}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {selectedGroupId && !loading && rows.length === 0 && !analytics && (
          <p style={{ color: '#666', fontSize: '14px' }}>Bu grupta kayıtlı sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', padding: '24px 20px' },
  inner: { maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  logo: { fontSize: '13px', fontWeight: '500', color: GOLD, letterSpacing: '2px' },
  linkBtn: { background: 'transparent', border: 'none', color: GOLD, fontSize: '13px', cursor: 'pointer' },
  section: { background: CARD, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '11px', color: '#555', letterSpacing: '1px' },
  select: { height: '48px', background: BG, border: '1px solid #2a2a2a', borderRadius: '10px', padding: '0 14px', color: '#fff', fontSize: '15px', outline: 'none', width: '100%' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    width: '100%'
  },
  statsRow2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: { background: CARD, borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  statNum: { fontSize: '24px', fontWeight: '600', color: GOLD },
  statLabel: { fontSize: '12px', color: '#888' },
  statHint: { fontSize: '10px', color: '#555' },
  profileBlock: { display: 'flex', flexDirection: 'column', gap: '6px' },
  profileHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' },
  profileName: { fontSize: '13px', color: '#ccc' },
  profileMeta: { fontSize: '12px', color: GOLD },
  track: { height: '8px', background: '#1a1a1a', borderRadius: '4px', overflow: 'hidden' },
  trackFill: { height: '100%', background: GOLD, borderRadius: '4px' },
  chartWrap: { width: '100%', minHeight: 280 },
  participantRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    background: BG,
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '12px 14px',
    cursor: 'pointer',
    color: '#e0e0e0'
  },
  pName: { fontSize: '14px', fontWeight: '500' },
  pScore: { fontSize: '18px', fontWeight: '600', color: GOLD },
  pProfile: { fontSize: '11px', color: '#888', maxWidth: '120px', textAlign: 'right' }
}
