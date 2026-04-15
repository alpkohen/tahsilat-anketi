const GOLD = '#C9A84C'
const SEG_DIM = ['#3a3010', '#4a3e10', '#3a3010']

/** Çubuk genişlikleri: %37.5 + %37.5 + %25 — puan aralıkları 50–65, 70–80, 85–90 ile hizalı */
function scoreToBarPercent(score) {
  const s = Number(score)
  if (!Number.isFinite(s)) return 0
  if (s <= 50) return 0
  if (s <= 65) return ((s - 50) / 15) * 37.5
  if (s < 70) return 37.5
  if (s <= 80) return 37.5 + ((s - 70) / 10) * 37.5
  if (s < 85) return 75
  if (s <= 90) return 75 + ((s - 85) / 5) * 25
  return 100
}

/** Noktanın hangi üçlü bölgede olduğu — o bölge altın vurgulanır */
function activeZoneFromPercent(percent) {
  if (percent < 37.5) return 0
  if (percent < 75) return 1
  return 2
}

const SEGMENTS = [
  { left: '0%', width: '37.5%' },
  { left: '37.5%', width: '37.5%' },
  { left: '75%', width: '25%' }
]

export function ScaleBar({ score }) {
  const percent = scoreToBarPercent(score)
  const active = activeZoneFromPercent(percent)

  return (
    <div style={{ padding: '8px 0 4px', width: '100%' }}>
      <div style={{ position: 'relative', height: '4px', borderRadius: '2px', margin: '0 0 8px', overflow: 'hidden', background: '#1f1f1f' }}>
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: seg.left,
              width: seg.width,
              height: '100%',
              background: active === i ? GOLD : SEG_DIM[i]
            }}
          />
        ))}
        <div style={{
          position: 'absolute',
          left: `${percent}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '12px',
          height: '12px',
          background: GOLD,
          borderRadius: '50%',
          border: '2px solid #0D0D0D',
          zIndex: 2
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' }}>
        <span style={{ width: '37.5%', textAlign: 'left', color: active === 0 ? GOLD : '#555' }}>Sorgu Hakimi<br />50–65</span>
        <span style={{ width: '37.5%', textAlign: 'center', color: active === 1 ? GOLD : '#555' }}>Empatik Dinleyici<br />70–80</span>
        <span style={{ width: '25%', textAlign: 'right', color: active === 2 ? GOLD : '#555' }}>Stratejist<br />85–90</span>
      </div>
    </div>
  )
}
