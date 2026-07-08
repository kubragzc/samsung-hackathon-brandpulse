def get_audience_analysis_prompt(brand_data):
    """
    Chain-of-Thought (CoT) prompt for audience segmentation.
    
    Args:
        brand_data (dict): Keys: brand_name, industry, product_name,
                           product_description, campaign_goal, target_market, brand_tone
    
    Returns:
        str: A detailed CoT prompt for Gemini to produce audience segments as JSON.
    """
    prompt = f"""
Sen deneyimli bir pazarlama stratejisti ve hedef kitle analiz uzmanısın.
Aşağıda sana bir marka ve ürün hakkında bilgiler verilecek. Bu bilgileri kullanarak
kapsamlı bir hedef kitle segmentasyonu analizi yapmanı istiyorum.

## Marka ve Ürün Bilgileri

- **Marka Adı:** {brand_data.get('brand_name', 'Belirtilmedi')}
- **Sektör:** {brand_data.get('industry', 'Belirtilmedi')}
- **Ürün Adı:** {brand_data.get('product_name', 'Belirtilmedi')}
- **Ürün Açıklaması:** {brand_data.get('product_description', 'Belirtilmedi')}
- **Kampanya Hedefi:** {brand_data.get('campaign_goal', 'Belirtilmedi')}
- **Hedef Pazar:** {brand_data.get('target_market', 'Belirtilmedi')}
- **Marka Tonu:** {brand_data.get('brand_tone', 'Belirtilmedi')}

## 📚 Marka / Ürün Bilgi Bankası (RAG Context)
{brand_data.get('knowledge_base', 'Bilgi bankası sağlanmadı. Genel bilgilere dayanarak analiz yap.')}

Eğer yukarıda bir bilgi bankası verildiyse, ürünü konumlandırırken ve kitleyi belirlerken **sadece** bu bilgi bankasındaki özellikleri ve tonu baz al.

## Görevin

Adım adım düşünerek (Chain-of-Thought) aşağıdaki analizi gerçekleştir:

### Adım 1: Sektör ve Ürün Analizi
Öncelikle verilen sektörü ve ürünü analiz et. Bu ürünün hangi ihtiyaçları karşıladığını,
pazardaki konumunu ve rekabet avantajlarını düşün.

### Adım 2: Potansiyel Müşteri Profillerini Belirleme
Ürünün özelliklerini, kampanya hedefini ve hedef pazarı göz önünde bulundurarak
en az 3, en fazla 5 farklı müşteri segmenti belirle. Her segmentin birbirinden
net şekilde ayrışması gerekiyor.

### Adım 3: Her Segment İçin Derinlemesine Profil Oluşturma
Her segment için demografik, psikografik ve davranışsal özellikleri detaylandır.

### Adım 4: Değer Önerisi Tanımlama
Tüm segmentleri kapsayan genel bir değer önerisi (value proposition) oluştur.

## Çıktı Formatı

Analizini YALNIZCA aşağıdaki JSON formatında döndür. JSON dışında hiçbir metin ekleme.
Düşünce sürecini JSON'un dışında YAZMA, sadece nihai sonucu ver.

```json
{{
  "value_proposition": "Tüm segmentleri kapsayan genel değer önerisi metni",
  "segments": [
    {{
      "name": "Segment adı (kısa ve akılda kalıcı)",
      "description": "Segmentin 2-3 cümlelik genel tanımı",
      "age_range": "Yaş aralığı (örn: 25-35)",
      "gender": "Cinsiyet dağılımı (örn: Ağırlıklı Kadın, Karma, Ağırlıklı Erkek)",
      "income_level": "Gelir seviyesi (örn: Orta-Üst, Yüksek)",
      "lifestyle": "Yaşam tarzı açıklaması",
      "interests": ["İlgi alanı 1", "İlgi alanı 2", "İlgi alanı 3"],
      "motivation": "Bu ürünü satın alma motivasyonu",
      "preferred_channels": ["Kanal 1", "Kanal 2"],
      "buying_behavior": "Satın alma davranışı açıklaması",
      "communication_tone": "Bu segmentle iletişimde kullanılacak ton",
      "key_message": "Bu segmente yönelik ana mesaj"
    }}
  ]
}}
```

## Önemli Kurallar

1. Segmentler Türkiye pazarına uygun olmalıdır.
2. Her segmentin ilgi alanları (interests) en az 3, en fazla 6 öğe içermelidir.
3. Tercih edilen kanallar (preferred_channels) en az 2, en fazla 4 öğe içermelidir.
4. Marka tonunu (brand_tone) dikkate alarak iletişim tonlarını belirle.
5. Değer önerisi güçlü, ikna edici ve özgün olmalıdır.
6. Tüm metinler Türkçe olmalıdır.
7. Yanıtın YALNIZCA geçerli bir JSON olmalıdır, başka açıklama ekleme.
"""
    return prompt
