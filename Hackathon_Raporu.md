# BrandPulse - Samsung Hackathon Proje Raporu

**Proje Adı:** BrandPulse: Yapay Zekâ Destekli Marka Lansman Asistanı
**Geliştirici:** Kübra Gezici

---

## 1. Seçtiğimiz Problem ve Çözüm Yaklaşımı
**Problem:** Pazarlama ekipleri, yeni bir ürün lansmanı yaparken pazar araştırması (hedef kitle analizi), her kitleye özel metin yazımı, görsel içerik üretimi ve bu içeriklerin marka güvenliği (etik) açısından denetimi gibi süreçlerde çok fazla zaman kaybetmektedir. Tüm bu süreçler manuel, kopuk ve yavaştır.

**Çözüm (BrandPulse):** Üretken yapay zekâyı merkeze alan Bütünleşik Kampanya Seti ve Marka Sesi Asistanı geliştirdik. Uygulamamız, kullanıcıdan aldığı kısa ürün ve marka bilgileriyle:
1. Ürüne en uygun müşteri segmentlerini çıkarır (Hedef Kitleye Göre Kişiselleştirme).
2. Her segment için farklı kanallara (Instagram, Email, Web) özel tonda içerikler üretir (Kampanya İçeriği Üretimi).
3. Etik değerlendirme algoritmasıyla içeriklerdeki riskleri (yanıltıcı vaat, siber zorbalık) denetler.
4. Sisteme yüklenen ham ürün görsellerini, lansman temasına uygun profesyonel stüdyo veya yaşam tarzı görsellerine dönüştürür (Image-to-Image).

## 2. Kullanılan Modeller
- **Metin ve Mantık Yürütme (Analiz, İçerik, Etik):** Google Gemini Flash (Yüksek hız, düşük gecikme ve maliyet etkinliği nedeniyle tercih edilmiştir).
- **Görsel Üretimi (Image-to-Image):** Google Gemini 3.1 Flash Image modeli (Kullanıcının yüklediği ham ürün görselini profesyonel bir lansman sahnesine yerleştirmesi için).

## 3. En Önemli Promptlarımız ve Tasarım Gerekçeleri

Projeyi geliştirirken yapay zekânın rastgele (halüsinasyonlu) veya verimsiz cevaplar vermesini engellemek için üç farklı Prompt Engineering (İstem Mühendisliği) tekniği bilinçli olarak kullanılmıştır:

### A. Adım Adım Düşündürme (Chain-of-Thought) - Hedef Kitle Analizi
Modelden doğrudan "Bana hedef kitleleri ver" demek yerine, modelin analitik düşünmesini sağlamak için süreci adımlara böldük.
**Prompt Kesiti:** *"Lütfen adım adım düşün: 1) Ürünün çözdüğü temel problemi analiz et. 2) Bu problemi yaşayan farklı insan tiplerini hayal et. 3) En yüksek potansiyelli segmentleri seç... Son olarak JSON dön."*
**Gerekçe:** Pazarlama stratejisinde mantıksal bir temel oluşturmadan üretilen segmentler çok yüzeysel kalıyordu. Bu sayede modelin derinlemesine analiz yapması sağlandı.

### B. Az Atışlı Öğrenme (Few-Shot Prompting) - İçerik Üretimi
Kanallara (Instagram, Email, vb.) özel içerik üretilirken, modelin çıktısının uygulama arayüzünde bozulmadan gösterilebilmesi için tam olarak istediğimiz JSON yapısında kalması gerekiyordu.
**Prompt Kesiti:** Modelin sistem prompt'una, "Eğer kanal Instagram ise tam olarak şu JSON şablonunu kullan: { "headline": "...", "body": "...", "hashtags": [...] }" şeklinde örnekler (shots) eklendi.
**Gerekçe:** Modelin platform dinamiklerine (Instagram'da hashtag, Email'de konu başlığı) tam uyum sağlaması garanti altına alındı.

### C. Bilgi Bankası (RAG Context)
**Gerekçe:** LLM'lerin en büyük zafiyeti olmayan özellikleri uydurmasıdır (Halüsinasyon). Kullanıcıdan alınan "Pil 5000mAh, Kamera 200MP" gibi kesin veriler prompt'a "SADECE BU BİLGİLERİ KULLAN" komutuyla dinamik olarak enjekte edilerek bu risk sıfıra indirildi.

## 4. Etik Değerlendirme ve Risk Yönetimi (Zero-Shot)
**Risk Tespiti:** Yapay zekâ, "en iyi", "kesin çözüm" gibi yanıltıcı, abartılı vaatler üretebilir veya bazı müşteri segmentlerini dışlayıcı dil kullanabilir.
**Çözüm Yaklaşımımız:** Sisteme özel bir "Etik Değerlendirme Modülü" entegre ettik. Üretilen tüm metinler yayınlanmadan önce, modele hiçbir örnek verilmeden (Zero-Shot Prompting) şu talimatla denetlenir:
*"Aşağıdaki pazarlama içeriklerini şu kriterlere göre incele: 1. Yanıltıcı ve abartılı vaatler, 2. Saldırgan veya ayrımcı dil, 3. Marka güvenliği riskleri. Sorun bulursan puanı düşür ve düzeltme önerisi sun."*
Böylece kullanıcı, içerikleri yayına almadan önce yapay zekânın kendi kendini denetlediği bir güvenlik süzgecinden geçirmiş olur.

## 5. Karşılaşılan Zorluklar
- **Görsel Üretiminde (Image-to-Image) SDK Uyumluluğu:** Google'ın yeni `gemini-3.1-flash-image` modeline geçerken eski kütüphaneler yerine yeni `google-genai` kütüphanesine geçiş yapmak ve `aspect_ratio` parametresi gibi API katmanı uyuşmazlıklarını çözmek gerekti. Hatalar debug edilerek çözüldü.
- **API Kota Sınırları (HTTP 429):** Eş zamanlı olarak 3 farklı kanal için (Instagram, Mail, Web) içerik üretilirken Gemini Free Tier kotalarına (RPM limiti) takılmalar yaşandı. Bu sorunu aşmak için hem arka planda model optimize edildi hem de asenkron API çağrılarıyla yük dağıtıldı.
