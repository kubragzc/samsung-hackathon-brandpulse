# BrandPulse: Yapay Zekâ Destekli Marka Lansman Asistanı 

BrandPulse, markaların hedef kitle analizinden başlayarak kişiselleştirilmiş çok kanallı (Instagram, E-posta, Web) içerik üretimine ve hatta yapay zekâ tabanlı görsel kurgulamaya kadar olan tüm pazarlama iletişim süreçlerini otomatize eden gelişmiş bir asistan aracıdır. **Samsung Hackathon** kapsamında geliştirilmiştir.

## 🌟 Öne Çıkan Özellikler

- **Gelişmiş Hedef Kitle Analizi (Chain-of-Thought):** Ürün ve marka bilgilerini analiz ederek, ürüne en uygun detaylı pazarlama segmentleri (persona) çıkarır.
- **Çok Kanallı İçerik Üretimi (Few-Shot Prompting):** Her persona için ayrı ayrı olmak üzere platform spesifik (Instagram, Email, Web) içerikler üretir.
- **RAG (Retrieval-Augmented Generation) Destekli İçerik:** Halüsinasyonu önlemek ve içeriği kurumsal bilgi bankasına uygun tutmak için kullanıcıdan alınan "ürün teknik veri tabanını" (RAG Context) tüm üretim sürecine dahil eder.
- **Etik ve Marka Güvenliği Filtresi (Zero-Shot):** Üretilen metinleri yayınlanmadan önce siber zorbalık, yanıltıcı vaat, telif hakkı riski veya markaya zarar verecek üslup açısından analiz edip raporlar.
- **Ürün Görseli Tabanlı Yapay Zekâ Üretimi (Image-to-Image):** Sisteme yüklenen ham ürün görsellerini, Gemini 3.1 Flash Image modeli kullanarak profesyonel lansman sahnelerine dönüştürür.

---

## 🧠 Kullanılan Prompt Engineering Stratejileri

Bu projede Gemini modellerinin en yüksek verimle çalışması için en güncel *Prompt Engineering* (İstem Mühendisliği) metotları kullanılmıştır:

### 1. Chain-of-Thought (Düşünce Zinciri)
Hedef kitle analizi sırasında modele doğrudan "segmentleri ver" demek yerine, "Önce ürünün pazar dinamiklerini düşün, ardından kitlenin acı noktalarını (pain points) belirle, daha sonra buna uygun segmentleri oluştur" şeklinde adım adım düşünme talimatı (Chain-of-Thought) verilmiştir.
> **Prompt Örneği:** *"Lütfen adım adım düşün: 1) Ürünün çözdüğü temel problemi analiz et. 2) Bu problemi yaşayan farklı insan tiplerini hayal et... Son olarak bu verileri JSON olarak dön."*

### 2. RAG Context (Bilgi Bankası Enjeksiyonu)
Modelin gerçek dışı donanım özelliği veya fiyat uydurmasını engellemek için, marka tarafından sağlanan kesin veriler (Knowledge Base) sistem prompt'una dinamik olarak enjekte edilir.
> **Prompt Örneği:** *"Aşağıdaki ürün gerçeklerini kullanarak içerik üret ve sadece burada yazan özellikleri vurgula: {knowledge_base}"*

### 3. Few-Shot Prompting (Az Atışlı Öğrenme)
İçerik üretiminin JSON şemasına ve istenilen pazarlama tonuna (örneğin Instagram için bol emojili ve kancalı, Email için resmi ve CTA odaklı) sadık kalması için prompt'un içerisine 1-2 adet mükemmel örnek (örnek JSON çıktıları) yerleştirilmiştir. Bu sayede modelin yanıt şablonu %100 kontrol altında tutulur.

### 4. Zero-Shot Ethical Review (Sıfır Atışlı Etik Değerlendirme)
Modelin çok güçlü olan genel kültür ve muhakeme yeteneği kullanılarak, oluşturulan onca içerik tek bir seferde ön bilgi verilmeden (Zero-Shot) etik incelemeye sokulur. "Bu içeriklerde abartılı vaat veya markayı zora sokacak hukuki bir açık var mı?" diye sorulur.

### 5. Image-to-Image (Ürün Lansman Görseli)
Gemini 3.1 Flash Image yetenekleri kullanılarak, kullanıcıdan gelen ham `product_image` ve modelin analiz ettiği `kampanya tonu` birleştirilerek, ürünü yansıtan ancak profesyonel bir arka plana (ör: stüdyo veya yaşam tarzı konsepti) sahip büyüleyici görseller üretilir.

---

## ⚙️ Kurulum ve Çalıştırma

1. Repoyu bilgisayarınıza klonlayın.
2. Gerekli kütüphaneleri yükleyin:
   ```bash
   pip install fastapi uvicorn python-dotenv pydantic google-genai google-generativeai jinja2 python-multipart
   ```
3. Proje ana dizininde bir `.env` dosyası oluşturun ve Gemini API anahtarınızı ekleyin:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
4. Sunucuyu başlatın:
   ```bash
   python app.py
   ```
5. Tarayıcınızdan `http://localhost:5000` adresine giderek uygulamayı kullanmaya başlayabilirsiniz!

## 🔐 Güvenlik
Bu projede API anahtarları `.env` dosyasında tutulmakta olup `.gitignore` ile repo dışında bırakılmıştır. Kod içerisine kesinlikle doğrudan anahtar (hardcoded) eklenmemiştir.
