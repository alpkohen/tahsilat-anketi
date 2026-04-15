const GROUP1 = [1, 2, 4, 5, 6, 7, 9, 10]
const GROUP2 = [3, 8]

export function calculateScores(answers) {
  const group1 = GROUP1.reduce((sum, q) => sum + (answers[`q${q}`] || 0), 0)
  const group2 = GROUP2.reduce((sum, q) => sum + (answers[`q${q}`] || 0), 0)
  const final = 100 - (group1 + group2)
  return { group1, group2, final }
}

export function getProfile(finalScore) {
  if (finalScore <= 65) return {
    name: 'Sorgu Hakimi',
    sub: 'Kurallar ve prosedür önceliği',
    diagnosis: 'Tahsilat görüşmelerinde kurallara olan hakimiyetiniz ve prosedürel bilginiz gerçekten güçlü. Ancak bu gücü kullanırken zaman zaman borçlunun duygusal durumunu ikinci plana atıyor olabilirsiniz. Eğitimimizde odak noktamız şu olacak: aynı kararlılığı koruyarak borçlunun direncini yumuşatmak ve ödeme taahhüdüne daha hızlı ulaşmak.',
    focus: ['İhtiyaç Analizi', 'Psikolojik Kontrol', 'Reframing']
  }
  if (finalScore <= 80) return {
    name: 'Empatik Dinleyici',
    sub: 'İletişim ve güven güçlü',
    diagnosis: 'Borçluyla bağ kurma ve iletişim kanalını açık tutma konusunda doğal bir yeteneksiniz var. Bu çok değerli — çünkü tahsilatta güven olmadan sonuç almak çok zor. Şu an eksik olan halka ise bu sıcak ilişkiyi somut bir ödeme taahhüdüne dönüştürme becerisi. Eğitimimizde tam olarak bu köprüyü inşa edeceğiz.',
    focus: ['Ödeme Niyeti', 'Kayıp Korkusu', 'Sıcak Nokta İkna']
  }
  return {
    name: 'Müzakere Stratejisti',
    sub: 'Denge ve müzakere gücü yüksek',
    diagnosis: 'Hem kuralları hem de insan psikolojisini dengeli kullanan nadir profillerdensınız. Tahsilat görüşmelerinde hem sınırları koruyup hem de borçluyu çözüme yönlendirebiliyorsunuz. Eğitimimizde bu dengeyi daha karmaşık senaryolarda — çoklu borç yapıları, çok taraflı müzakereler — nasıl koruyacağınıza odaklanacağız.',
    focus: ['Karmaşık Borç Yapıları', 'İkna Sanatı', 'Koçluk Yaklaşımı']
  }
}
