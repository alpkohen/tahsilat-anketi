import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { calculateScores, getProfile } from '../lib/scoring'

const QUESTIONS = [
  { id: 1, text: 'Borçlu "param yok" deyip sustuğunda "Geçmiş olsun" der ve direkt teknik sorulara geçmeyi daha etkili bulurum.' },
  { id: 2, text: 'Görüşmenin başında borçluya yatırması gereken tutarı direkt söyleyerek ne zaman ödeyeceğini sormayı en doğru yol olarak görürüm.' },
  { id: 3, text: 'Borçlu "Beni avukata verin, ne olacaksa olsun" dediğinde, başka bir müzakere tekniği kullanmakta zorlanırım.' },
  { id: 4, text: 'Müşteri lafımı kesip "Biliyorum bunları, boşuna anlatma" dediğinde, sesimi daha da otoriter hale getirerek prosedürü okumaya devam ederim.' },
  { id: 5, text: 'İşsiz olduğunu söyleyen müşteriye "Bu borcun da ödenmesi lazım, nasıl yapabilirsiniz?" yaklaşımıyla ilerlemeyi daha etkili bulurum.' },
  { id: 6, text: 'Borçlu sertleştiğinde, ses tonumu yumuşatmak yerine daha sert bir tonda otorite kurmaya çalışırım.' },
  { id: 7, text: 'Müşterinin "90. günü bekleyeceğim" direncini kırmak için en iyi yöntemim yasal süreleri ve faiz risklerini tebliğ etmektir.' },
  { id: 8, text: 'Borçlu "Yasal prosedürü biliyorum, boşuna çenenizi yormayın" dediğinde ne diyeceğimi bilemez ve görüşmeyi yönetmekte zorlanırım.' },
  { id: 9, text: 'Görüşmenin büyük kısmında daha çok ben konuşarak yasal süreleri ve sonuçları anlatmayı daha etkili bulurum.' },
  { id: 10, text: 'Borçlu "Söz verdiğim tarihe kadar ödeyemezsem mahcup olurum" dediğinde ne diyeceğimi bilemez ve görüşmeyi yönetmekte zorlanırım.' }
]

export default function Survey() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [hoverLikert, setHoverLikert] = useState(null)

  const question = QUESTIONS[current]
  const progress = ((current) / QUESTIONS.length) * 100

  const handleSelect = (val) => {
    setAnswers(prev => ({ ...prev, [`q${question.id}`]: val }))
  }

  const handleNext = async () => {
    if (!answers[`q${question.id}`]) return
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
      return
    }
    setSaving(true)
    const participant = JSON.parse(sessionStorage.getItem('participant') || '{}')
    const { data: groupData } = await supabase.from('survey_groups').select('id').eq('slug', slug).single()
    const { data: pData } = await supabase.from('participants').insert({
      group_id: groupData.id,
      first_name: participant.firstName,
      last_name: participant.lastName,
      department: participant.department || null
    }).select().single()

    const scores = calculateScores(answers)
    const profile = getProfile(scores.final)
    const { data: rData } = await supabase.from('results').insert({
      participant_id: pData.id,
      ...answers,
      group1_score: scores.group1,
      group2_score: scores.group2,
      final_score: scores.final,
      profile: profile.name
    }).select().single()

    navigate(`/result/${rData.id}`)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>UNIQ</span>
          <span style={styles.stepPill}>{current + 1} / {QUESTIONS.length}</span>
        </div>

        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>

        <div style={styles.body}>
          <p style={styles.qNum}>SORU {question.id}</p>
          <p style={styles.qText}>{question.text}</p>

          <div style={styles.scaleLabels}>
            <span>Hiç katılmıyorum</span>
            <span>Tamamen katılıyorum</span>
          </div>

          <div style={styles.likertWrap}>
            <div style={styles.likert}>
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = answers[`q${question.id}`] === n
                const hovered = hoverLikert === n && !selected
                return (
                  <button
                    key={n}
                    type="button"
                    style={{
                      ...styles.lkBtn,
                      ...(selected ? styles.lkBtnSel : {}),
                      ...(hovered ? styles.lkBtnHover : {})
                    }}
                    onMouseEnter={() => setHoverLikert(n)}
                    onMouseLeave={() => setHoverLikert(null)}
                    onClick={() => handleSelect(n)}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div style={styles.likertDivider} aria-hidden />
          </div>

          <button style={{
            ...styles.nextBtn,
            opacity: answers[`q${question.id}`] ? 1 : 0.4
          }} onClick={handleNext} disabled={saving}>
            {saving ? 'Kaydediliyor...' : current === QUESTIONS.length - 1 ? 'Tamamla' : 'Devam →'}
          </button>

          {current > 0 && (
            <button style={styles.backBtn} onClick={() => setCurrent(current - 1)}>← Geri</button>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { width: '100%', maxWidth: '400px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  logo: { fontSize: '13px', fontWeight: '500', color: '#C9A84C', letterSpacing: '2px' },
  stepPill: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#888' },
  progressBar: { height: '3px', background: '#1f1f1f', borderRadius: '2px', marginBottom: '24px' },
  progressFill: { height: '100%', background: '#C9A84C', borderRadius: '2px', transition: 'width 0.4s' },
  body: { display: 'flex', flexDirection: 'column', gap: '16px' },
  qNum: { fontSize: '11px', color: '#C9A84C', fontWeight: '500', letterSpacing: '1px' },
  qText: { fontSize: '15px', color: '#e0e0e0', lineHeight: '1.7' },
  scaleLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#555' },
  likertWrap: { display: 'flex', flexDirection: 'column', gap: '8px' },
  likert: { display: 'flex', gap: '4px' },
  likertDivider: { height: '1px', background: '#1f1f1f', width: '100%' },
  lkBtn: {
    flex: 1,
    height: '54px',
    background: 'transparent',
    border: 'none',
    color: '#444',
    fontSize: '18px',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'all 0.15s',
    boxSizing: 'border-box',
    padding: 0,
    minWidth: 0
  },
  lkBtnSel: {
    background: '#1f1800',
    border: '1.5px solid #C9A84C',
    color: '#C9A84C'
  },
  lkBtnHover: {
    background: '#161616',
    color: '#888'
  },
  nextBtn: { width: '100%', height: '54px', background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
  backBtn: { width: '100%', height: '44px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '14px', color: '#666', fontSize: '14px', cursor: 'pointer' }
}
