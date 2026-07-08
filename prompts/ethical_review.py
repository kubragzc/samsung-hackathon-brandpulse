def get_ethical_review_prompt(all_content_text):
    """
    Zero-Shot prompt for ethical risk assessment of generated content.
    
    Args:
        all_content_text (str): Formatted string of all generated content
                                across segments and channels.
    
    Returns:
        str: A prompt that asks Gemini to evaluate ethical risks and return JSON.
    """
    prompt = f"""
Sen bir etik pazarlama ve reklam denetim uzmanısın. Aşağıda bir pazarlama kampanyası
kapsamında farklı hedef kitle segmentleri ve kanallar için üretilmiş tüm içerikler verilmiştir.
Bu içerikleri kapsamlı bir etik değerlendirmeden geçirmen gerekmektedir.

## Değerlendirilecek İçerikler

{all_content_text}

## Etik Değerlendirme Kriterleri

Aşağıdaki kriterlere göre her bir içeriği ve genel kampanyayı değerlendir:

### 1. Doğruluk ve Şeffaflık
- İçerikte yanıltıcı veya abartılı ifadeler var mı?
- Ürün özellikleri doğru ve doğrulanabilir şekilde mi sunulmuş?
- Gizli koşullar veya belirsiz ifadeler var mı?

### 2. Ayrımcılık ve Kapsayıcılık
- Cinsiyet, yaş, ırk, din veya diğer gruplara yönelik ayrımcı ifadeler var mı?
- Stereotipler güçlendiriliyor mu?
- Dil kapsayıcı mı?

### 3. Manipülasyon ve Baskı
- Tüketici üzerinde aşırı baskı veya manipülasyon oluşturan ifadeler var mı?
- FOMO (kaçırma korkusu) etik sınırlar içinde mi kullanılıyor?
- Duygusal manipülasyon yapılıyor mu?

### 4. Gizlilik ve Veri Kullanımı
- Kişisel veri toplama veya kullanımına ilişkin sorunlu ifadeler var mı?
- Hedefleme stratejileri etik mi?

### 5. Hassas İçerik
- Çocuklara veya savunmasız gruplara yönelik uygunsuz içerik var mı?
- Sağlık, güvenlik veya finansal konularda sorumsuz vaatler var mı?

### 6. Kültürel Duyarlılık
- Türk kültürüne ve değerlerine uygun mu?
- Kültürel açıdan hassas konulara dikkat edilmiş mi?

### 7. Yasal Uyumluluk
- Türkiye reklam mevzuatına uygun mu?
- Tüketici hakları korunuyor mu?

## Risk Seviyeleri

- **düşük**: Etik açıdan sorun yok veya çok küçük iyileştirme önerileri
- **orta**: Dikkat edilmesi gereken noktalar var, düzeltme önerilir
- **yüksek**: Ciddi etik sorunlar mevcut, içeriğin yeniden gözden geçirilmesi gerekli

## Çıktı Formatı

Değerlendirmeni YALNIZCA aşağıdaki JSON formatında döndür. JSON dışında hiçbir metin ekleme.

```json
{{
  "overall_risk_level": "düşük | orta | yüksek",
  "overall_score": 85,
  "summary": "Genel değerlendirme özeti (3-5 cümle)",
  "findings": [
    {{
      "segment": "Segment adı",
      "channel": "Kanal adı (instagram / email / web_banner)",
      "risk_level": "düşük | orta | yüksek",
      "issues": [
        "Tespit edilen sorun veya öneri 1",
        "Tespit edilen sorun veya öneri 2"
      ]
    }}
  ],
  "general_recommendations": [
    "Genel öneri 1",
    "Genel öneri 2",
    "Genel öneri 3"
  ],
  "positive_aspects": [
    "Olumlu tespit 1",
    "Olumlu tespit 2"
  ]
}}
```

## Önemli Kurallar

1. Her segment ve kanal kombinasyonu için ayrı bir finding oluştur.
2. overall_score 0-100 arasında bir tam sayı olmalıdır (100 = hiç etik sorun yok).
3. Issues dizisi boş olabilir (sorun yoksa).
4. general_recommendations en az 2, en fazla 5 öğe içermelidir.
5. positive_aspects en az 1 öğe içermelidir.
6. Tüm metinler Türkçe olmalıdır.
7. Yanıtın YALNIZCA geçerli bir JSON olmalıdır.
8. Değerlendirmende adil, tarafsız ve yapıcı ol.
"""
    return prompt
