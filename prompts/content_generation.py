def get_content_generation_prompt(brand_data, segment, channel):
    """
    Few-Shot prompt for multi-channel content generation.
    
    Args:
        brand_data (dict): Brand information dict.
        segment (dict): A single audience segment dict.
        channel (str): One of 'instagram', 'email', 'web_banner'.
    
    Returns:
        str: A few-shot prompt with Turkish Samsung Galaxy examples.
    """

    # --- Few-Shot Examples per channel ---
    few_shot_examples = {
        "instagram": """
## Örnek Instagram İçerikleri (Few-Shot)

### Örnek 1 – Samsung Galaxy S25 Ultra / Teknoloji Meraklıları
```json
{{
  "headline": "Geceyi Gündüze Çevir 🌙✨",
  "body": "Galaxy S25 Ultra'nın 200MP kamerasıyla karanlık artık engel değil. Gece modunda çektiğin her kare, profesyonel bir fotoğrafa dönüşsün. #GalaxyS25Ultra #NightographyTR",
  "cta": "Şimdi Keşfet 👉 Link bio'da",
  "hashtags": ["#SamsungTürkiye", "#GalaxyS25Ultra", "#NightographyTR", "#MobilFotoğrafçılık", "#Teknoloji"],
  "visual_description": "Gece İstanbul silüetinin Galaxy S25 Ultra ile çekilmiş nefes kesen fotoğrafı. Boğaz Köprüsü ışıkları suda yansıyor. Alt kısımda minimal Galaxy S25 Ultra ürün görseli.",
  "post_type": "Carousel (3 kare: gece fotoğrafı, ürün yakın çekim, özellik infografik)",
  "best_posting_time": "20:00 - 22:00"
}}
```

### Örnek 2 – Samsung Galaxy Z Fold6 / İş Profesyonelleri
```json
{{
  "headline": "İşini Katla, Verimliliğini Aç 💼",
  "body": "Galaxy Z Fold6 ile multitasking'in sınırlarını zorla. Üç uygulamayı aynı anda çalıştır, sunumlarını büyük ekranda düzenle. İş hayatın cebine sığsın.",
  "cta": "Detayları incele ➡️ Bio'daki linke tıkla",
  "hashtags": ["#GalaxyZFold6", "#SamsungTürkiye", "#Verimlilik", "#İşHayatı", "#KatlanabilirTelefon"],
  "visual_description": "Modern ofis ortamında Galaxy Z Fold6 açık halde masada, ekranda üç farklı uygulama penceresi görünüyor. Yanında kahve ve not defteri.",
  "post_type": "Reels (15sn: telefon katlanıyor, açılıyor, multitasking gösterimi)",
  "best_posting_time": "12:00 - 14:00"
}}
```
""",
        "email": """
## Örnek E-posta İçerikleri (Few-Shot)

### Örnek 1 – Samsung Galaxy S25 Ultra / Teknoloji Meraklıları
```json
{{
  "subject_line": "🌟 Fotoğrafçılığın Geleceği Cebinde – Galaxy S25 Ultra",
  "preview_text": "200MP kamerayla profesyonel kalitede fotoğraflar çekin",
  "greeting": "Merhaba {{{{isim}}}},",
  "body_sections": [
    {{
      "heading": "Fotoğrafçılığı Yeniden Tanımla",
      "content": "Yeni Galaxy S25 Ultra, 200MP kamerası ve yapay zeka destekli görüntü işleme teknolojisiyle mobil fotoğrafçılıkta devrim yaratıyor. Gece ya da gündüz, her anı en iyi haliyle yakala."
    }},
    {{
      "heading": "Neden Galaxy S25 Ultra?",
      "content": "• 200MP Ana Kamera ile üstün detay\\n• Gelişmiş Nightography ile gece çekimleri\\n• AI destekli fotoğraf düzenleme\\n• 5000mAh pil ile tüm gün performans"
    }},
    {{
      "heading": "Özel Lansman Fırsatı",
      "content": "İlk 1000 sipariş için Galaxy Buds3 Pro hediye! Üstelik 12 aya varan taksit seçenekleriyle."
    }}
  ],
  "cta_text": "Hemen Keşfet",
  "cta_url_placeholder": "https://samsung.com/tr/galaxy-s25-ultra",
  "closing": "Teknolojinin bir adım önünde olun.\\nSamsung Türkiye Ekibi",
  "unsubscribe_note": "Bu e-postayı almak istemiyorsanız buradan aboneliğinizi iptal edebilirsiniz."
}}
```

### Örnek 2 – Samsung Galaxy Z Flip6 / Genç Yetişkinler
```json
{{
  "subject_line": "Tarzını Katla, Farkını Göster ✨ Galaxy Z Flip6",
  "preview_text": "Modanın ve teknolojinin buluşma noktası",
  "greeting": "Selam {{{{isim}}}},",
  "body_sections": [
    {{
      "heading": "Tarzın Kadar Esnek",
      "content": "Galaxy Z Flip6 sadece bir telefon değil, bir stil aksesurası. Kompakt tasarımı cebine, FlexCam özelliği sosyal medya içeriklerine mükemmel uyum sağlıyor."
    }},
    {{
      "heading": "Dikkat Çekici Özellikler",
      "content": "• FlexCam ile hands-free selfie ve video\\n• Kapak ekranında widget'lar ve hızlı yanıtlar\\n• Kişiselleştirilebilir renk seçenekleri\\n• Su ve toz dayanıklılığı (IPX8)"
    }}
  ],
  "cta_text": "Renk Seçeneklerini Gör",
  "cta_url_placeholder": "https://samsung.com/tr/galaxy-z-flip6",
  "closing": "Tarzınla öne çık!\\nSamsung Türkiye",
  "unsubscribe_note": "E-posta tercihlerinizi güncellemek için tıklayın."
}}
```
""",
        "web_banner": """
## Örnek Web Banner İçerikleri (Few-Shot)

### Örnek 1 – Samsung Galaxy S25 Ultra / Teknoloji Meraklıları
```json
{{
  "main_headline": "Karanlığı Fetheden Kamera",
  "sub_headline": "Galaxy S25 Ultra ile gece fotoğrafçılığında yeni bir çağ",
  "body_copy": "200MP kamera. AI destekli Nightography. Her anı kusursuz yakala.",
  "cta_text": "Hemen İncele",
  "banner_sizes": ["728x90 Leaderboard", "300x250 Medium Rectangle", "160x600 Wide Skyscraper"],
  "visual_direction": "Koyu gradient arka plan (lacivert → siyah). Sol tarafta Galaxy S25 Ultra'nın eğimli ürün görseli, ekranında gece çekilmiş etkileyici bir İstanbul manzarası. Sağda beyaz tipografi ile başlık ve CTA butonu (Samsung mavi).",
  "color_scheme": "Ana: Samsung Lacivert (#1428A0), Aksent: Beyaz (#FFFFFF), Arka plan: Koyu Gradient",
  "animation_notes": "Ürün görseli hafif dönerek sahneye girer → Başlık fade-in → CTA butonu pulse efekti"
}}
```

### Örnek 2 – Samsung Galaxy Tab S10 / Öğrenciler
```json
{{
  "main_headline": "Derslerini Dönüştür",
  "sub_headline": "Galaxy Tab S10 ile not al, çiz, öğren",
  "body_copy": "S Pen ile doğal yazım deneyimi. Ders notlarından çizimlere, her şey tek tablette.",
  "cta_text": "Öğrenci Fırsatını Yakala",
  "banner_sizes": ["728x90 Leaderboard", "300x250 Medium Rectangle", "970x250 Billboard"],
  "visual_direction": "Aydınlık, modern kampüs ortamı arka planı. Merkezde Galaxy Tab S10 ve S Pen, ekranda renkli notlar görünüyor. Genç, enerjik renk paleti.",
  "color_scheme": "Ana: Samsung Mavi (#1428A0), Aksent: Turuncu (#FF6F00), Arka plan: Açık Gri (#F5F5F5)",
  "animation_notes": "Tablet ekranında not yazılıyor animasyonu → Başlık slide-in → CTA butonu renk geçişi"
}}
```
"""
    }

    channel_labels = {
        "instagram": "Instagram Gönderi",
        "email": "E-posta Pazarlama",
        "web_banner": "Web Banner Reklam"
    }

    channel_output_schemas = {
        "instagram": """```json
{{
  "headline": "Dikkat çekici başlık (emoji kullanılabilir)",
  "body": "Gönderi metni (maksimum 2200 karakter, ideal 150-200 kelime)",
  "cta": "Harekete geçirici çağrı",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "visual_description": "Görsel yönergesinin detaylı açıklaması",
  "image_prompt": "İngilizce, detaylı ve yüksek kaliteli bir AI image generation promptu (örn: A photorealistic shot of...). Bu görsel, metne tam uygun olmalı.",
  "post_type": "Gönderi tipi (Carousel, Reels, Tek Görsel, Story)",
  "best_posting_time": "Önerilen paylaşım saati"
}}
```""",
        "email": """```json
{{
  "subject_line": "E-posta konu satırı (emoji kullanılabilir, maks 60 karakter)",
  "preview_text": "Ön izleme metni (maks 90 karakter)",
  "greeting": "Kişiselleştirilmiş selamlama",
  "body_sections": [
    {{
      "heading": "Bölüm başlığı",
      "content": "Bölüm içeriği"
    }}
  ],
  "cta_text": "CTA buton metni",
  "cta_url_placeholder": "Örnek URL",
  "closing": "Kapanış metni",
  "unsubscribe_note": "Abonelik iptali notu",
  "image_prompt": "İngilizce, detaylı ve yüksek kaliteli bir AI image generation promptu (örn: A vibrant header image showing...). E-posta başlığında kullanılacak görsel için."
}}
```""",
        "web_banner": """```json
{{
  "main_headline": "Ana başlık (kısa ve etkili, maks 6 kelime)",
  "sub_headline": "Alt başlık (destekleyici mesaj)",
  "body_copy": "Kısa açıklama metni (maks 20 kelime)",
  "cta_text": "CTA buton metni (maks 3 kelime)",
  "banner_sizes": ["Önerilen banner boyutları"],
  "visual_direction": "Görsel yönlendirme detayları",
  "color_scheme": "Renk şeması açıklaması",
  "animation_notes": "Animasyon/hareket önerileri",
  "image_prompt": "İngilizce, detaylı ve yüksek kaliteli bir AI image generation promptu (örn: A horizontal banner background featuring...). Web banner için."
}}
```"""
    }

    selected_examples = few_shot_examples.get(channel, few_shot_examples["instagram"])
    channel_label = channel_labels.get(channel, channel)
    output_schema = channel_output_schemas.get(channel, channel_output_schemas["instagram"])

    # Build segment details string
    interests_str = ", ".join(segment.get("interests", [])) if isinstance(segment.get("interests"), list) else segment.get("interests", "Belirtilmedi")
    channels_str = ", ".join(segment.get("preferred_channels", [])) if isinstance(segment.get("preferred_channels"), list) else segment.get("preferred_channels", "Belirtilmedi")

    prompt = f"""
Sen yaratıcı bir dijital pazarlama içerik uzmanısın. Aşağıda sana bir marka, hedef kitle segmenti
ve kanal bilgisi verilecek. Bu bilgilere dayanarak özgün ve etkili bir {channel_label} içeriği üretmelisin.

## Marka Bilgileri

- **Marka Adı:** {brand_data.get('brand_name', 'Belirtilmedi')}
- **Sektör:** {brand_data.get('industry', 'Belirtilmedi')}
- **Ürün Adı:** {brand_data.get('product_name', 'Belirtilmedi')}
- **Ürün Açıklaması:** {brand_data.get('product_description', 'Belirtilmedi')}
- **Kampanya Hedefi:** {brand_data.get('campaign_goal', 'Belirtilmedi')}
- **Marka Tonu:** {brand_data.get('brand_tone', 'Belirtilmedi')}

## 📚 Marka / Ürün Bilgi Bankası (RAG Context)
{brand_data.get('knowledge_base', 'Bilgi bankası sağlanmadı. Genel bilgilere dayanarak üret.')}

Bu bilgi bankası markaya ait %100 doğru gerçek verileri içerir. Lütfen içerik üretirken **ASLA uydurma özellik (halüsinasyon) ekleme**, sadece yukarıdaki bilgi bankasındaki özellikleri ve teknik detayları kullan.


## Hedef Kitle Segmenti

- **Segment Adı:** {segment.get('name', 'Belirtilmedi')}
- **Açıklama:** {segment.get('description', 'Belirtilmedi')}
- **Yaş Aralığı:** {segment.get('age_range', 'Belirtilmedi')}
- **Cinsiyet:** {segment.get('gender', 'Belirtilmedi')}
- **Gelir Seviyesi:** {segment.get('income_level', 'Belirtilmedi')}
- **Yaşam Tarzı:** {segment.get('lifestyle', 'Belirtilmedi')}
- **İlgi Alanları:** {interests_str}
- **Motivasyon:** {segment.get('motivation', 'Belirtilmedi')}
- **Tercih Edilen Kanallar:** {channels_str}
- **Satın Alma Davranışı:** {segment.get('buying_behavior', 'Belirtilmedi')}
- **İletişim Tonu:** {segment.get('communication_tone', 'Belirtilmedi')}
- **Ana Mesaj:** {segment.get('key_message', 'Belirtilmedi')}

## Kanal: {channel_label}

{selected_examples}

## Senin Görevin

Yukarıdaki örneklerden ilham alarak (ama birebir kopyalamadan), verilen marka ve segment bilgilerine
uygun özgün bir {channel_label} içeriği üret.

## İçerik Üretim Kuralları

1. İçerik tamamen **Türkçe** olmalıdır.
2. Marka tonuna ({brand_data.get('brand_tone', 'profesyonel')}) ve segment iletişim tonuna uygun olmalıdır.
3. Hedef kitlenin yaş aralığına, ilgi alanlarına ve motivasyonuna hitap etmelidir.
4. Kampanya hedefini ({brand_data.get('campaign_goal', 'Belirtilmedi')}) desteklemelidir.
5. Yaratıcı, dikkat çekici ve harekete geçirici olmalıdır.
6. Kültürel olarak Türkiye pazarına uygun olmalıdır.
7. Etik kurallara uygun olmalı, yanıltıcı veya ayrımcı ifadeler içermemelidir.

## Çıktı Formatı

Yanıtını YALNIZCA aşağıdaki JSON formatında döndür. JSON dışında hiçbir metin ekleme.

{output_schema}

Sadece geçerli JSON döndür, başka açıklama veya yorum ekleme.
"""
    return prompt
