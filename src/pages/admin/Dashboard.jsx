import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
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
const BORDER = '1px solid #2a2a2a'
const PUBLIC_SURVEY_BASE = 'https://tahsilat-anketi.netlify.app'

const toSlug = (str) => String(str || '')
  .toLowerCase()
  .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
  .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

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

function formatGroupDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return '—'
  }
}

function QuestionAvgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const raw = payload[0]?.value
  const v = typeof raw === 'number' ? raw : Number(raw)
  const text = Number.isFinite(v) ? v.toFixed(2) : '—'
  return (
    <div style={{ background: '#111', border: BORDER, borderRadius: '8px', padding: '10px 14px', color: GOLD }}>
      <div style={{ fontSize: '15px', fontWeight: 600, color: GOLD }}>Ortalama: {text}</div>
      {label != null && label !== '' && (
        <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>{label}</div>
      )}
    </div>
  )
}

/** Anketi tamamlayan (results kaydı olan) katılımcı sayısı */
function participantCountFromGroup(g) {
  return typeof g.completedCount === 'number' ? g.completedCount : 0
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedGroupId = searchParams.get('group') || ''
  const analyticsRef = useRef(null)

  const [groups, setGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState([])

  const [groupName, setGroupName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createdLink, setCreatedLink] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true)
    const { data: grps, error: e1 } = await supabase
      .from('survey_groups')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false })
    if (e1) {
      setLoadingGroups(false)
      console.error(e1)
      setGroups([])
      return
    }
    if (!grps?.length) {
      setGroups([])
      setLoadingGroups(false)
      return
    }
    const { data: parts } = await supabase.from('participants').select('id, group_id')
    const { data: res } = await supabase.from('results').select('participant_id')
    const done = new Set((res || []).map((r) => r.participant_id))
    const byGroup = {}
    ;(parts || []).forEach((p) => {
      if (done.has(p.id)) {
        byGroup[p.group_id] = (byGroup[p.group_id] || 0) + 1
      }
    })
    setGroups(grps.map((g) => ({ ...g, completedCount: byGroup[g.id] || 0 })))
    setLoadingGroups(false)
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

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
      questionAvgs.push({ q: `S${i}`, avg: vals.length ? avg(vals) : 0, n: vals.length })
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

  const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId), [groups, selectedGroupId])

  const onNameChange = (e) => {
    const v = e.target.value
    setGroupName(v)
    if (!slugTouched) setSlug(toSlug(v))
  }

  const onSlugChange = (e) => {
    setSlugTouched(true)
    setSlug(toSlug(e.target.value))
  }

  const surveyUrl = (s) => `${PUBLIC_SURVEY_BASE}/s/${s}`

  const handleCreate = async () => {
    setCreateError('')
    setCreateSuccess(false)
    setCreatedLink('')
    const cleanSlug = toSlug(slug)
    if (!groupName.trim()) {
      setCreateError('Grup / müşteri adı zorunludur.')
      return
    }
    if (!cleanSlug) {
      setCreateError('Geçerli bir URL kodu girin.')
      return
    }
    setCreating(true)
    const { data, error } = await supabase.from('survey_groups').insert({ name: groupName.trim(), slug: cleanSlug }).select().single()
    setCreating(false)
    if (error) {
      setCreateError(error.message || 'Oluşturulamadı. URL kodu kullanılıyor olabilir.')
      return
    }
    setSlug(cleanSlug)
    setCreatedLink(surveyUrl(data.slug))
    setCreateSuccess(true)
    loadGroups()
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  const openAnalytics = (groupId) => {
    setSearchParams({ group: groupId })
    setTimeout(() => {
      analyticsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const setGroupParam = (id) => {
    if (id) setSearchParams({ group: id })
    else setSearchParams({})
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: '24px 20px 48px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: GOLD, letterSpacing: '2px' }}>UNIQ Admin</div>
          <button type="button" onClick={() => navigate('/admin/participants')} style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: '14px', cursor: 'pointer', minHeight: '44px', padding: '0 8px' }}>
            Tüm katılımcılar →
          </button>
        </header>

        {/* BÖLÜM 1 */}
        <section>
          <h2 style={{ fontSize: '13px', color: '#888', letterSpacing: '1.5px', marginBottom: '14px', fontWeight: 600 }}>YENİ ANKET GRUBU OLUŞTUR</h2>
          <div style={{ background: CARD, border: BORDER, borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#aaa' }}>Grup / Müşteri Adı</label>
              <input
                type="text"
                placeholder="Örn: Enpara Tahsilat Ekibi"
                value={groupName}
                onChange={onNameChange}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: '#aaa' }}>URL Kodu</label>
              <input
                type="text"
                placeholder="otomatik-uretilir"
                value={slug}
                onChange={onSlugChange}
                style={inputStyle}
              />
              <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>Grup adından üretilir; isterseniz düzenleyebilirsiniz.</p>
            </div>
            {createError && <p style={{ color: '#f87171', fontSize: '13px', margin: 0 }}>{createError}</p>}
            {createSuccess && (
              <p style={{ color: '#22c55e', fontSize: '14px', margin: 0, fontWeight: 500 }}>Grup oluşturuldu. Aşağıdaki linki paylaşabilirsiniz.</p>
            )}
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              style={{
                minHeight: '52px',
                background: GOLD,
                color: BG,
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: creating ? 'wait' : 'pointer',
                opacity: creating ? 0.85 : 1
              }}
            >
              {creating ? 'Oluşturuluyor…' : 'Oluştur ve Link Al'}
            </button>
            {createdLink && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#555', letterSpacing: '0.5px' }}>ANKET LİNKİ</span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                  <input type="text" readOnly value={createdLink} style={{ ...inputStyle, flex: '1 1 220px', minWidth: 0, cursor: 'text' }} />
                  <button
                    type="button"
                    onClick={() => copyText(createdLink)}
                    style={{
                      minHeight: '48px',
                      minWidth: '140px',
                      padding: '0 20px',
                      background: '#1a1600',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      borderRadius: '12px',
                      color: GOLD,
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Kopyala
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1f1f1f', margin: 0 }} />

        {/* BÖLÜM 2 */}
        <section>
          <h2 style={{ fontSize: '13px', color: '#888', letterSpacing: '1.5px', marginBottom: '14px', fontWeight: 600 }}>MEVCUT ANKET GRUPLARI</h2>
          {loadingGroups && <p style={{ color: '#666', fontSize: '14px' }}>Yükleniyor…</p>}
          {!loadingGroups && groups.length === 0 && (
            <p style={{ color: '#666', fontSize: '14px' }}>Henüz grup yok. Yukarıdan yeni grup oluşturun.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {groups.map((g) => {
              const cnt = participantCountFromGroup(g)
              const url = surveyUrl(g.slug)
              return (
                <div
                  key={g.id}
                  style={{ background: CARD, border: BORDER, borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontSize: '17px', fontWeight: 600, color: '#eee', margin: '0 0 6px' }}>{g.name}</p>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Oluşturulma: {formatGroupDate(g.created_at)}</p>
                      <p style={{ fontSize: '13px', color: '#9a9a9a', margin: '10px 0 0' }}>
                        <strong style={{ color: GOLD }}>{cnt}</strong> katılımcı anketi tamamladı
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAnalytics(g.id)}
                      style={{
                        minHeight: '48px',
                        padding: '0 18px',
                        background: BG,
                        border: BORDER,
                        borderRadius: '12px',
                        color: GOLD,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      Sonuçları Gör
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                    <input type="text" readOnly value={url} style={{ ...inputStyle, flex: '1 1 200px', minWidth: 0, fontSize: '12px' }} />
                    <button
                      type="button"
                      onClick={() => copyText(url)}
                      style={{
                        minHeight: '48px',
                        minWidth: '120px',
                        padding: '0 16px',
                        background: '#1a1600',
                        border: '1px solid rgba(201, 168, 76, 0.35)',
                        borderRadius: '12px',
                        color: GOLD,
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid #1f1f1f', margin: 0 }} />

        {/* BÖLÜM 3 */}
        <section ref={analyticsRef} id="group-analytics">
          <h2 style={{ fontSize: '13px', color: '#888', letterSpacing: '1.5px', marginBottom: '14px', fontWeight: 600 }}>GRUP ANALİZİ</h2>
          {!selectedGroupId && (
            <div style={{ background: CARD, border: BORDER, borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Analiz görmek için yukarıdan bir grubun <strong style={{ color: '#888' }}>Sonuçları Gör</strong> butonuna tıklayın.</p>
            </div>
          )}

          {selectedGroupId && selectedGroup && (
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: '#e0e0e0' }}>
                Seçili grup: <span style={{ color: GOLD, fontWeight: 600 }}>{selectedGroup.name}</span>
              </p>
              <button
                type="button"
                onClick={() => setGroupParam('')}
                style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', minHeight: '44px' }}
              >
                Analizi kapat
              </button>
            </div>
          )}

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

          {selectedGroupId && !loading && rows.length === 0 && !analytics && selectedGroup && (
            <div style={{ background: CARD, border: BORDER, borderRadius: '14px', padding: '20px' }}>
              <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Bu grupta henüz tamamlanmış anket sonucu yok.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const inputStyle = {
  minHeight: '48px',
  background: BG,
  border: BORDER,
  borderRadius: '10px',
  padding: '0 14px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const styles = {
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    width: '100%'
  },
  statsRow2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statCard: { background: CARD, border: BORDER, borderRadius: '14px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
  statNum: { fontSize: '24px', fontWeight: '600', color: GOLD },
  statLabel: { fontSize: '12px', color: '#888' },
  statHint: { fontSize: '10px', color: '#555' },
  section: { background: CARD, border: BORDER, borderRadius: '14px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  sectionTitle: { fontSize: '11px', color: '#555', letterSpacing: '1px' },
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
    minHeight: '48px',
    cursor: 'pointer',
    color: '#e0e0e0'
  },
  pName: { fontSize: '14px', fontWeight: '500' },
  pScore: { fontSize: '18px', fontWeight: '600', color: GOLD },
  pProfile: { fontSize: '11px', color: '#888', maxWidth: '120px', textAlign: 'right' }
}
