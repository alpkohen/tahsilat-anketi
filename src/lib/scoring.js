const GROUP1 = [1, 2, 4, 5, 6, 7, 9, 10]
const GROUP2 = [3, 8]

/** Dashboard profil dağılımı sırası (getProfile().name ile aynı) */
export const PROFILE_ORDER = [
  'Kural ve Süreç Odaklı Uzman',
  'Sempatik ve İletişim Odaklı Dinleyici',
  'Müzakere Stratejisti'
]

/** Eski DB kayıtlarındaki profil adlarını yenilere eşler */
export function normalizeStoredProfile(stored) {
  if (!stored) return stored
  const map = {
    'Sorgu Hakimi': 'Kural ve Süreç Odaklı Uzman',
    'Empatik Dinleyici': 'Sempatik ve İletişim Odaklı Dinleyici'
  }
  return map[stored] || stored
}

export function calculateScores(answers) {
  const group1 = GROUP1.reduce((sum, q) => sum + (answers[`q${q}`] || 0), 0)
  const group2 = GROUP2.reduce((sum, q) => sum + (answers[`q${q}`] || 0), 0)
  const final = 100 - (group1 + group2)
  return { group1, group2, final }
}

export function getProfile(finalScore) {
  if (finalScore <= 65) return {
    name: 'Kural ve Süreç Odaklı Uzman',
    sub: 'Sert / Mekanik',
    diagnosis: 'Kurallara hakimiyetiniz harika! Şimdi bu gücü, borçlunun duygusunu yönetip stratejik empatiyle ve direnci tahsilata dönüştürecek müzakere becerisiyle taçlandırmanın zamanı.',
    focus: ['İhtiyaç Analizi', 'Psikolojik Kontrol', 'Reframing']
  }
  if (finalScore <= 80) return {
    name: 'Sempatik ve İletişim Odaklı Dinleyici',
    sub: 'Sempatik / Sonuçsuz',
    diagnosis: 'İletişim gücünüz mükemmel! Şimdi bu samimiyeti stratejik empatiye ve borçlunun ödeme niyetini yasal bir taahhüde dönüştürecek ikna teknikleriyle birleştirme zamanı.',
    focus: ['Ödeme Niyeti', 'Kayıp Korkusu', 'Sıcak Nokta İkna']
  }
  return {
    name: 'Müzakere Stratejisti',
    sub: 'Dengeli / Çözüm Odaklı',
    diagnosis: 'Tebrikler! Siz kurallara hakimiyetinizle uzlaşıcı yaklaşımınızı dengede kullanabiliyorsunuz. Eğitimde bu becerinizi daha da derinleştirip ustalık aşamasına taşıyacağız.',
    focus: ['Karmaşık Borç Yapıları', 'İkna Sanatı', 'Koçluk Yaklaşımı']
  }
}
