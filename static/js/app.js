/* ═══════════════════════════════════════════════════════════════
   BrandPulse — Frontend Application Logic
   Samsung Innovation Campus · Hackathon 2025
   FastAPI Backend Compatible
   ═══════════════════════════════════════════════════════════════ */

// ─── State Management ───
const state = {
    currentStep: 1,
    brandData: null,
    audienceData: null,
    contentData: null,
    ethicsData: null,
};

// ─── DOM Ready ───
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    const form = document.getElementById('brand-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            startAnalysis();
        });
    }
    showStep(1);
}

/* ═══════════════ STEP MANAGEMENT ═══════════════ */

function showStep(n) {
    state.currentStep = n;

    document.querySelectorAll('.step-section').forEach((sec) => {
        sec.classList.remove('active');
    });

    const target = document.getElementById(`step-${n}`);
    if (target) {
        target.classList.add('active');
    }

    document.querySelectorAll('.progress-step').forEach((step) => {
        const stepNum = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (stepNum === n) {
            step.classList.add('active');
        } else if (stepNum < n) {
            step.classList.add('completed');
        }
    });

    const lines = document.querySelectorAll('.progress-step__line');
    lines.forEach((line, i) => {
        if (i < n - 1) {
            line.classList.add('filled');
        } else {
            line.classList.remove('filled');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════ STEP 1 → AUDIENCE ANALYSIS ═══════════════ */

async function startAnalysis() {
    const form = document.getElementById('brand-form');
    const formData = new FormData(form);

    let product_image_base64 = null;
    const imageFile = formData.get('product_image');
    if (imageFile && imageFile.size > 0) {
        product_image_base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(imageFile);
        });
    }

    state.brandData = {
        brand_name: formData.get('brand_name')?.trim(),
        industry: formData.get('industry')?.trim(),
        product_name: formData.get('product_name')?.trim(),
        product_description: formData.get('product_description')?.trim(),
        campaign_goal: formData.get('campaign_goal'),
        target_market: formData.get('target_market')?.trim(),
        brand_tone: formData.get('brand_tone')?.trim(),
        knowledge_base: formData.get('knowledge_base')?.trim() || null,
        custom_image_prompt: formData.get('custom_image_prompt')?.trim() || null,
        product_image_base64: product_image_base64
    };

    // knowledge_base, custom_image_prompt and product_image_base64 are optional, check others
    const requiredKeys = ['brand_name', 'industry', 'product_name', 'product_description', 'target_market', 'brand_tone'];
    for (const key of requiredKeys) {
        if (!state.brandData[key]) {
            showToast('Lütfen zorunlu tüm alanları doldurun', 'warning');
            return;
        }
    }

    showStep(2);
    analyzeAudience();
}

async function analyzeAudience() {
    showLoading('step-2');

    try {
        const res = await fetch('/api/audience-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.brandData),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || `Sunucu hatası: ${res.status}`);
        }

        // FastAPI returns the parsed result directly:
        // { value_proposition: "...", segments: [...] }
        state.audienceData = data;
        hideLoading('step-2');

        const segments = data.segments || (Array.isArray(data) ? data : []);
        renderSegmentCards(segments);
        showToast('Hedef kitle analizi tamamlandı!');
    } catch (err) {
        hideLoading('step-2');
        showError('step-2', 'Hedef Kitle Analizi Başarısız', err.message);
    }
}

/* ═══════════════ STEP 2 → CONTENT GENERATION ═══════════════ */

async function generateContent() {
    showStep(3);
    showLoading('step-3');

    try {
        // Extract segments from audienceData
        const segments = state.audienceData?.segments || (Array.isArray(state.audienceData) ? state.audienceData : []);

        const res = await fetch('/api/generate-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                brand_data: state.brandData,
                segments: segments,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || `Sunucu hatası: ${res.status}`);
        }

        // FastAPI returns the content array directly:
        // [ { segment_name: "...", channels: { instagram: {...}, ... } }, ... ]
        state.contentData = data;
        hideLoading('step-3');
        renderContentTabs(Array.isArray(data) ? data : []);
        showToast('İçerik üretimi tamamlandı!');
    } catch (err) {
        hideLoading('step-3');
        showError('step-3', 'İçerik Üretimi Başarısız', err.message);
    }
}

/* ═══════════════ STEP 3 → ETHICS REVIEW ═══════════════ */

async function reviewEthics() {
    showStep(4);
    showLoading('step-4');

    try {
        // state.contentData is already the array from generate-content
        const contentArray = Array.isArray(state.contentData) ? state.contentData : [];

        const res = await fetch('/api/ethical-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                brand_data: state.brandData,
                all_content: contentArray,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || `Sunucu hatası: ${res.status}`);
        }

        // FastAPI returns the ethics result directly:
        // { overall_risk_level: "...", overall_score: 85, findings: [...], ... }
        state.ethicsData = data;
        hideLoading('step-4');
        renderEthicsReport(data);
        showToast('Etik değerlendirme tamamlandı!');
    } catch (err) {
        hideLoading('step-4');
        showError('step-4', 'Etik Değerlendirme Başarısız', err.message);
    }
}

/* ═══════════════ RENDER: SEGMENT CARDS ═══════════════ */

function renderSegmentCards(segments) {
    const grid = document.getElementById('segments-grid');
    if (!grid) return;

    const segmentList = Array.isArray(segments) ? segments : (segments?.segments || []);

    if (segmentList.length === 0) {
        grid.innerHTML = '<p class="empty-state">Segment verisi bulunamadı.</p>';
        const results = document.getElementById('step-2-results');
        if (results) results.style.display = 'block';
        return;
    }

    grid.innerHTML = segmentList
        .map((seg, i) => {
            const interests = Array.isArray(seg.interests) ? seg.interests : (Array.isArray(seg.ilgi_alanlari) ? seg.ilgi_alanlari : []);
            const channels = Array.isArray(seg.preferred_channels) ? seg.preferred_channels : (Array.isArray(seg.tercih_edilen_kanallar) ? seg.tercih_edilen_kanallar : []);
            const name = seg.name || seg.segment_name || seg.segment_adi || `Segment ${i + 1}`;
            const desc = seg.description || seg.aciklama || '';
            const ageRange = seg.age_range || seg.yas_araligi || '';
            const gender = seg.gender || seg.cinsiyet || '';
            const income = seg.income_level || seg.gelir_seviyesi || '';
            const lifestyle = seg.lifestyle || seg.yasam_tarzi || '';
            const motivation = seg.motivation || seg.motivasyon || '';
            const commTone = seg.communication_tone || seg.iletisim_tonu || '';
            const keyMsg = seg.key_message || seg.ana_mesaj || '';
            const buyBehavior = seg.buying_behavior || seg.satin_alma_davranisi || '';

            return `
            <div class="segment-card" style="animation-delay: ${i * 0.15}s">
                <div class="segment-card__header">
                    <span class="segment-card__number">${i + 1}</span>
                    <h3 class="segment-card__name">${escHtml(name)}</h3>
                </div>
                <p class="segment-card__desc">${escHtml(desc)}</p>
                <div class="segment-card__meta">
                    ${ageRange ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">👤 Yaş Aralığı</span>
                        <span class="segment-card__field-value">${escHtml(ageRange)}</span>
                    </div>` : ''}

                    ${gender ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">⚤ Cinsiyet</span>
                        <span class="segment-card__field-value">${escHtml(gender)}</span>
                    </div>` : ''}

                    ${income ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">💰 Gelir Seviyesi</span>
                        <span class="segment-card__field-value">${escHtml(income)}</span>
                    </div>` : ''}

                    ${lifestyle ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">🌟 Yaşam Tarzı</span>
                        <span class="segment-card__field-value">${escHtml(lifestyle)}</span>
                    </div>` : ''}

                    ${interests.length ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">💡 İlgi Alanları</span>
                        <div class="tags">
                            ${interests.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${motivation ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">🎯 Motivasyon</span>
                        <span class="segment-card__field-value">${escHtml(motivation)}</span>
                    </div>` : ''}

                    ${channels.length ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">📡 Tercih Edilen Kanallar</span>
                        <div class="tags">
                            ${channels.map(c => `<span class="tag tag--channel">${escHtml(c)}</span>`).join('')}
                        </div>
                    </div>` : ''}

                    ${commTone ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">🗣️ İletişim Tonu</span>
                        <span class="segment-card__field-value">${escHtml(commTone)}</span>
                    </div>` : ''}

                    ${keyMsg ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">💬 Ana Mesaj</span>
                        <span class="segment-card__field-value segment-card__field-value--highlight">${escHtml(keyMsg)}</span>
                    </div>` : ''}

                    ${buyBehavior ? `
                    <div class="segment-card__field">
                        <span class="segment-card__field-label">🛒 Satın Alma Davranışı</span>
                        <span class="segment-card__field-value">${escHtml(buyBehavior)}</span>
                    </div>` : ''}
                </div>
            </div>`;
        })
        .join('');

    const results = document.getElementById('step-2-results');
    if (results) results.style.display = 'block';
}

/* ═══════════════ RENDER: CONTENT TABS ═══════════════ */

function renderContentTabs(contentArray) {
    const tabNav = document.getElementById('segment-tabs');
    const panels = document.getElementById('content-panels');
    if (!tabNav || !panels) return;

    if (contentArray.length === 0) {
        panels.innerHTML = '<p class="empty-state">İçerik verisi bulunamadı.</p>';
        const results = document.getElementById('step-3-results');
        if (results) results.style.display = 'block';
        return;
    }

    // Build segment tabs
    tabNav.innerHTML = contentArray
        .map((seg, i) => {
            const name = seg.segment_name || seg.segment_adi || `Segment ${i + 1}`;
            return `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchSegmentTab(${i})" data-seg="${i}">${escHtml(name)}</button>`;
        })
        .join('');

    // Build panels
    panels.innerHTML = contentArray
        .map((seg, i) => {
            const channels = seg.channels || seg.kanallar || {};
            const channelKeys = Object.keys(channels);
            const channelLabels = {
                instagram: '📱 Instagram',
                email: '📧 E-posta',
                'e-posta': '📧 E-posta',
                web_banner: '🌐 Web Banner',
                web: '🌐 Web Banner',
            };

            const channelTabsHtml = channelKeys
                .map((key, ci) => {
                    const label = channelLabels[key.toLowerCase()] || `📢 ${key}`;
                    return `<button class="channel-tab ${ci === 0 ? 'active' : ''}" onclick="switchChannelTab(${i}, '${escAttr(key)}')" data-channel="${escAttr(key)}">${label}</button>`;
                })
                .join('');

            const channelPanelsHtml = channelKeys
                .map((key, ci) => {
                    const content = channels[key];
                    const formattedHtml = formatContentCard(content, key);
                    const rawText = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

                    return `
                    <div class="channel-panel ${ci === 0 ? 'active' : ''}" data-seg="${i}" data-channel="${escAttr(key)}">
                        <div class="content-card">
                            <div class="content-card__header">
                                <h4 class="content-card__title">${channelLabels[key.toLowerCase()] || key}</h4>
                                <button class="copy-btn" onclick="copyContent(${i}, '${escAttr(key)}')">
                                    📋 Kopyala
                                </button>
                            </div>
                            <div class="content-card__body">${formattedHtml}</div>
                        </div>
                    </div>`;
                })
                .join('');

            return `
            <div class="content-panel ${i === 0 ? 'active' : ''}" data-seg="${i}">
                <div class="channel-tabs">${channelTabsHtml}</div>
                ${channelPanelsHtml}
            </div>`;
        })
        .join('');

    const results = document.getElementById('step-3-results');
    if (results) results.style.display = 'block';

    generateAsyncImages();
}

async function generateAsyncImages() {
    const containers = document.querySelectorAll('.async-image-container');
    
    for (const container of containers) {
        const prompt = container.getAttribute('data-prompt');
        if (!prompt) continue;
        
        try {
            const res = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand_data: state.brandData,
                    image_prompt: prompt
                })
            });
            
            const data = await res.json();
            if (data.success && data.image_base64) {
                container.innerHTML = `<img src="${data.image_base64}" alt="AI Generated Graphic" loading="lazy" />`;
            } else {
                container.innerHTML = `<div class="error-text">Görsel üretilemedi: ${data.detail || 'Bilinmeyen hata'}</div>`;
            }
        } catch (err) {
            container.innerHTML = `<div class="error-text">Görsel üretim hatası: ${err.message}</div>`;
        }
    }
}

/* ═══════════════ FORMAT CONTENT CARD ═══════════════ */

function formatContentCard(content, channel) {
    if (!content || content.raw_content) {
        return `<pre class="content-raw">${escHtml(content?.raw_content || JSON.stringify(content, null, 2))}</pre>`;
    }

    if (channel === 'instagram') {
        return formatInstagramContent(content);
    } else if (channel === 'email') {
        return formatEmailContent(content);
    } else if (channel === 'web_banner') {
        return formatWebBannerContent(content);
    }

    return `<pre class="content-raw">${escHtml(JSON.stringify(content, null, 2))}</pre>`;
}

function formatInstagramContent(c) {
    return `
        <div class="formatted-content formatted-content--instagram">
            ${c.image_prompt ? `<div class="fc__generated-image async-image-container" data-prompt="${escAttr(c.image_prompt)}">
                <div class="async-image-loader">
                    <div class="spinner-ring"></div>
                    <span>Lansman Görseli Üretiliyor...</span>
                </div>
            </div>` : ''}
            ${c.headline ? `<h3 class="fc__headline">${escHtml(c.headline)}</h3>` : ''}
            ${c.body ? `<p class="fc__body">${escHtml(c.body)}</p>` : ''}
            ${c.cta ? `<p class="fc__cta">${escHtml(c.cta)}</p>` : ''}
            ${c.hashtags?.length ? `<div class="fc__hashtags">${c.hashtags.map(h => `<span class="fc__hashtag">${escHtml(h)}</span>`).join(' ')}</div>` : ''}
            ${c.visual_description ? `<div class="fc__visual"><span class="fc__visual-label">🎨 Görsel Yönergesi:</span> ${escHtml(c.visual_description)}</div>` : ''}
            ${c.image_prompt ? `<div class="fc__visual"><span class="fc__visual-label">🤖 AI Prompt:</span> ${escHtml(c.image_prompt)}</div>` : ''}
            ${c.post_type ? `<span class="fc__meta-tag">📐 ${escHtml(c.post_type)}</span>` : ''}
            ${c.best_posting_time ? `<span class="fc__meta-tag">🕐 ${escHtml(c.best_posting_time)}</span>` : ''}
        </div>`;
}

function formatEmailContent(c) {
    const bodySections = c.body_sections || [];
    const imageUrl = c.image_prompt ? `https://image.pollinations.ai/prompt/${encodeURIComponent(c.image_prompt)}?width=1200&height=600&nologo=true` : '';
    return `
        <div class="formatted-content formatted-content--email">
            ${c.subject_line ? `<div class="fc__email-field"><span class="fc__email-label">📌 Konu:</span> <strong>${escHtml(c.subject_line)}</strong></div>` : ''}
            ${c.preview_text ? `<div class="fc__email-field"><span class="fc__email-label">👁️ Ön İzleme:</span> ${escHtml(c.preview_text)}</div>` : ''}
            <hr class="fc__divider">
            ${imageUrl ? `<div class="fc__generated-image"><img src="${imageUrl}" alt="AI Generated Header" loading="lazy" /></div>` : ''}
            ${c.greeting ? `<p class="fc__greeting">${escHtml(c.greeting)}</p>` : ''}
            ${bodySections.map(s => `
                <div class="fc__email-section">
                    ${s.heading ? `<h4 class="fc__email-heading">${escHtml(s.heading)}</h4>` : ''}
                    ${s.content ? `<p class="fc__email-text">${escHtml(s.content).replace(/\\n/g, '<br>')}</p>` : ''}
                </div>
            `).join('')}
            ${c.cta_text ? `<div class="fc__email-cta"><button class="fc__email-cta-btn">${escHtml(c.cta_text)}</button></div>` : ''}
            ${c.closing ? `<p class="fc__closing">${escHtml(c.closing).replace(/\\n/g, '<br>')}</p>` : ''}
        </div>`;
}

function formatWebBannerContent(c) {
    const imageUrl = c.image_prompt ? `https://image.pollinations.ai/prompt/${encodeURIComponent(c.image_prompt)}?width=1200&height=400&nologo=true` : '';
    return `
        <div class="formatted-content formatted-content--banner">
            ${imageUrl ? `<div class="fc__generated-image"><img src="${imageUrl}" alt="AI Generated Banner" loading="lazy" /></div>` : ''}
            ${c.main_headline ? `<h2 class="fc__banner-headline">${escHtml(c.main_headline)}</h2>` : ''}
            ${c.sub_headline ? `<p class="fc__banner-subheadline">${escHtml(c.sub_headline)}</p>` : ''}
            ${c.body_copy ? `<p class="fc__banner-body">${escHtml(c.body_copy)}</p>` : ''}
            ${c.cta_text ? `<button class="fc__banner-cta">${escHtml(c.cta_text)}</button>` : ''}
            ${c.banner_sizes?.length ? `<div class="fc__banner-meta"><span class="fc__meta-label">📐 Banner Boyutları:</span> ${c.banner_sizes.map(s => `<span class="fc__meta-tag">${escHtml(s)}</span>`).join('')}</div>` : ''}
            ${c.visual_direction ? `<div class="fc__visual"><span class="fc__visual-label">🎨 Görsel Yönlendirme:</span> ${escHtml(c.visual_direction)}</div>` : ''}
            ${c.image_prompt ? `<div class="fc__visual"><span class="fc__visual-label">🤖 AI Prompt:</span> ${escHtml(c.image_prompt)}</div>` : ''}
            ${c.color_scheme ? `<div class="fc__visual"><span class="fc__visual-label">🎨 Renk Şeması:</span> ${escHtml(c.color_scheme)}</div>` : ''}
            ${c.animation_notes ? `<div class="fc__visual"><span class="fc__visual-label">✨ Animasyon:</span> ${escHtml(c.animation_notes)}</div>` : ''}
        </div>`;
}

function switchSegmentTab(index) {
    document.querySelectorAll('#segment-tabs .tab-btn').forEach((btn) => {
        btn.classList.toggle('active', parseInt(btn.dataset.seg) === index);
    });
    document.querySelectorAll('#content-panels .content-panel').forEach((panel) => {
        panel.classList.toggle('active', parseInt(panel.dataset.seg) === index);
    });
}

function switchChannelTab(segIndex, channel) {
    const panel = document.querySelector(`.content-panel[data-seg="${segIndex}"]`);
    if (!panel) return;

    panel.querySelectorAll('.channel-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.channel === channel);
    });
    panel.querySelectorAll('.channel-panel').forEach((cp) => {
        cp.classList.toggle('active', cp.dataset.channel === channel);
    });
}

/* ═══════════════ RENDER: ETHICS REPORT ═══════════════ */

function renderEthicsReport(data) {
    const dashboard = document.getElementById('ethics-dashboard');
    if (!dashboard) return;

    // overall_score is the "quality" score: 100 = no risk, 0 = max risk
    const score = data.overall_score ?? data.overall_risk_score ?? data.genel_risk_skoru ?? 75;
    const riskLevelRaw = (data.overall_risk_level || data.genel_risk_seviyesi || '').toLowerCase();
    const summary = data.summary || data.ozet || '';
    const findings = data.findings || data.bulgular || [];
    const recommendations = data.general_recommendations || data.recommendations || data.genel_oneriler || data.oneriler || [];
    const positives = data.positive_aspects || data.olumlu_yonler || [];

    // Determine risk level from score or label
    let riskLevel, riskLabel, riskColor;
    if (riskLevelRaw.includes('yüksek') || riskLevelRaw.includes('high')) {
        riskLevel = 'high'; riskLabel = 'Yüksek Risk'; riskColor = 'var(--danger)';
    } else if (riskLevelRaw.includes('orta') || riskLevelRaw.includes('medium')) {
        riskLevel = 'medium'; riskLabel = 'Orta Risk'; riskColor = 'var(--warning)';
    } else {
        riskLevel = 'low'; riskLabel = 'Düşük Risk'; riskColor = 'var(--success)';
    }

    // Render findings for each segment × channel
    const findingsHtml = findings.map(f => {
        const segName = f.segment || f.segment_name || '';
        const channelName = f.channel || f.kanal || '';
        const fRiskRaw = (f.risk_level || f.risk_seviyesi || 'düşük').toLowerCase();
        let fClass = 'low';
        if (fRiskRaw.includes('yüksek') || fRiskRaw.includes('high')) fClass = 'high';
        else if (fRiskRaw.includes('orta') || fRiskRaw.includes('medium')) fClass = 'medium';

        const fRiskLabel = fClass === 'high' ? 'Yüksek' : fClass === 'medium' ? 'Orta' : 'Düşük';

        const issues = f.issues || f.sorunlar || [];
        const issuesHtml = issues.map(issue => {
            if (typeof issue === 'string') {
                return `<li>${escHtml(issue)}</li>`;
            }
            const desc = issue.description || issue.aciklama || '';
            const sev = issue.severity || issue.siddet || '';
            const rec = issue.recommendation || issue.oneri || '';
            return `<li>
                ${sev ? `<span class="severity-badge severity-badge--${getSevClass(sev)}">${escHtml(sev)}</span>` : ''}
                ${escHtml(desc)}
                ${rec ? `<div class="finding-recommendation">💡 ${escHtml(rec)}</div>` : ''}
            </li>`;
        }).join('');

        return `
        <div class="ethics-finding ethics-finding--${fClass}">
            <div class="ethics-finding__header">
                <span class="severity-badge severity-badge--${fClass}">${fRiskLabel}</span>
                <span class="ethics-finding__label">${escHtml(segName)}${channelName ? ` · ${escHtml(channelName)}` : ''}</span>
            </div>
            ${issuesHtml ? `<ul class="ethics-finding__issues">${issuesHtml}</ul>` : '<p class="ethics-finding__clean">✅ Bu kombinasyonda önemli bir sorun tespit edilmedi.</p>'}
        </div>`;
    }).join('');

    dashboard.innerHTML = `
        <!-- Score Card -->
        <div class="ethics-score-card">
            <div class="ethics-score-circle ethics-score-circle--${riskLevel}">
                <span class="ethics-score-value" data-target="${score}">0</span>
                <span class="ethics-score-max">/100</span>
                <span class="ethics-score-label">${riskLabel}</span>
            </div>
            <p class="ethics-summary">${escHtml(summary)}</p>
        </div>

        ${findingsHtml ? `
        <div class="ethics-section">
            <h3 class="ethics-section__title">🔍 Detaylı Bulgular</h3>
            ${findingsHtml}
        </div>` : ''}

        ${recommendations.length ? `
        <div class="ethics-section">
            <h3 class="ethics-section__title">💡 Genel Öneriler</h3>
            <ul class="ethics-list ethics-list--recommendations">
                ${recommendations.map(r => `<li>${escHtml(typeof r === 'string' ? r : (r.text || r.description || r.aciklama || ''))}</li>`).join('')}
            </ul>
        </div>` : ''}

        ${positives.length ? `
        <div class="ethics-section">
            <h3 class="ethics-section__title">✅ Olumlu Yönler</h3>
            <ul class="ethics-list ethics-list--positive">
                ${positives.map(p => `<li>${escHtml(typeof p === 'string' ? p : (p.text || p.description || p.aciklama || ''))}</li>`).join('')}
            </ul>
        </div>` : ''}
    `;

    const results = document.getElementById('step-4-results');
    if (results) results.style.display = 'block';

    animateScoreCounter(score);
}

function getSevClass(sev) {
    const s = (sev || '').toLowerCase();
    if (s.includes('yüksek') || s.includes('high')) return 'high';
    if (s.includes('orta') || s.includes('medium')) return 'medium';
    return 'low';
}

function animateScoreCounter(target) {
    const el = document.querySelector('.ethics-score-value');
    if (!el) return;

    let current = 0;
    const duration = 1500;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.round(current);
    }, 16);
}

/* ═══════════════ LOADING / ERROR ═══════════════ */

function showLoading(stepId) {
    const loading = document.getElementById(`${stepId}-loading`);
    const results = document.getElementById(`${stepId}-results`);
    if (loading) loading.style.display = 'block';
    if (results) results.style.display = 'none';
}

function hideLoading(stepId) {
    const loading = document.getElementById(`${stepId}-loading`);
    if (loading) loading.style.display = 'none';
}

function showError(stepId, title, message) {
    const loading = document.getElementById(`${stepId}-loading`);
    if (loading) {
        loading.innerHTML = `
            <div class="error-state">
                <div class="error-state__icon">⚠️</div>
                <h3 class="error-state__title">${escHtml(title)}</h3>
                <p class="error-state__text">${escHtml(message)}</p>
                <button class="btn btn--outline" onclick="location.reload()">
                    🔄 Tekrar Dene
                </button>
            </div>
        `;
        loading.style.display = 'block';
    }
    showToast(title, 'error');
}

/* ═══════════════ COPY TO CLIPBOARD ═══════════════ */

function copyContent(segIndex, channelKey) {
    const contentArray = Array.isArray(state.contentData) ? state.contentData : [];
    const seg = contentArray[segIndex];
    if (!seg) return;

    const content = seg.channels?.[channelKey] || {};
    const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    const btn = document.querySelector(`.channel-panel[data-seg="${segIndex}"][data-channel="${channelKey}"] .copy-btn`);
    copyToClipboard(text, btn);
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }

    if (button) {
        button.classList.add('copied');
        const original = button.innerHTML;
        button.innerHTML = '✓ Kopyalandı!';
        showToast('İçerik panoya kopyalandı');

        setTimeout(() => {
            button.classList.remove('copied');
            button.innerHTML = original;
        }, 2000);
    }
}

/* ═══════════════ DOWNLOAD REPORT ═══════════════ */

function downloadReport() {
    const lines = [];
    const sep = '═'.repeat(60);

    lines.push(sep);
    lines.push('  BrandPulse — Pazarlama Analiz Raporu');
    lines.push(`  Oluşturulma: ${new Date().toLocaleString('tr-TR')}`);
    lines.push(sep);
    lines.push('');

    // Brand Info
    if (state.brandData) {
        lines.push('📋 MARKA BİLGİLERİ');
        lines.push('─'.repeat(40));
        lines.push(`Marka: ${state.brandData.brand_name}`);
        lines.push(`Sektör: ${state.brandData.industry}`);
        lines.push(`Ürün: ${state.brandData.product_name}`);
        lines.push(`Hedef Pazar: ${state.brandData.target_market}`);
        lines.push(`Kampanya Hedefi: ${state.brandData.campaign_goal}`);
        lines.push(`Marka Tonu: ${state.brandData.brand_tone}`);
        lines.push(`Açıklama: ${state.brandData.product_description}`);
        lines.push('');
    }

    // Audience
    if (state.audienceData) {
        lines.push('👥 HEDEF KİTLE ANALİZİ');
        lines.push('─'.repeat(40));
        if (state.audienceData.value_proposition) {
            lines.push(`Değer Önerisi: ${state.audienceData.value_proposition}`);
        }
        const segs = state.audienceData.segments || (Array.isArray(state.audienceData) ? state.audienceData : []);
        segs.forEach((seg, i) => {
            lines.push(`\nSegment ${i + 1}: ${seg.name || seg.segment_name || ''}`);
            lines.push(`Açıklama: ${seg.description || ''}`);
            lines.push(`Yaş: ${seg.age_range || ''}`);
            lines.push(`Gelir: ${seg.income_level || ''}`);
            lines.push(`Motivasyon: ${seg.motivation || ''}`);
            if (seg.interests) lines.push(`İlgi Alanları: ${seg.interests.join(', ')}`);
            if (seg.preferred_channels) lines.push(`Kanallar: ${seg.preferred_channels.join(', ')}`);
            lines.push(`İletişim Tonu: ${seg.communication_tone || ''}`);
            lines.push(`Ana Mesaj: ${seg.key_message || ''}`);
        });
        lines.push('');
    }

    // Content
    if (state.contentData) {
        lines.push('✍️ ÜRETİLEN İÇERİKLER');
        lines.push('─'.repeat(40));
        const contents = Array.isArray(state.contentData) ? state.contentData : [];
        contents.forEach((seg) => {
            lines.push(`\n── Segment: ${seg.segment_name || ''} ──`);
            const channels = seg.channels || {};
            Object.entries(channels).forEach(([ch, content]) => {
                lines.push(`\n[${ch.toUpperCase()}]`);
                lines.push(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
            });
        });
        lines.push('');
    }

    // Ethics
    if (state.ethicsData) {
        lines.push('🛡️ ETİK DEĞERLENDİRME');
        lines.push('─'.repeat(40));
        lines.push(`Risk Seviyesi: ${state.ethicsData.overall_risk_level || ''}`);
        lines.push(`Skor: ${state.ethicsData.overall_score ?? ''}/100`);
        lines.push(`Özet: ${state.ethicsData.summary || ''}`);

        const findings = state.ethicsData.findings || [];
        if (findings.length) {
            lines.push('\nBulgular:');
            findings.forEach((f) => {
                lines.push(`  [${f.risk_level || ''}] ${f.segment || ''} - ${f.channel || ''}`);
                const issues = f.issues || [];
                issues.forEach(issue => {
                    if (typeof issue === 'string') {
                        lines.push(`    • ${issue}`);
                    } else {
                        lines.push(`    • [${issue.severity || ''}] ${issue.description || ''}`);
                        if (issue.recommendation) lines.push(`      💡 ${issue.recommendation}`);
                    }
                });
            });
        }

        const recs = state.ethicsData.general_recommendations || state.ethicsData.recommendations || [];
        if (recs.length) {
            lines.push('\nGenel Öneriler:');
            recs.forEach(r => lines.push(`  • ${typeof r === 'string' ? r : r.text || ''}`));
        }

        const pos = state.ethicsData.positive_aspects || [];
        if (pos.length) {
            lines.push('\nOlumlu Yönler:');
            pos.forEach(p => lines.push(`  ✓ ${typeof p === 'string' ? p : p.text || ''}`));
        }
        lines.push('');
    }

    lines.push(sep);
    lines.push('  Samsung Innovation Campus · Üretken Yapay Zekâ Hackathon 2025');
    lines.push('  Powered by Google Gemini AI');
    lines.push(sep);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BrandPulse_Rapor_${state.brandData?.brand_name || 'rapor'}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Rapor başarıyla indirildi');
}

/* ═══════════════ RESET ═══════════════ */

function resetAnalysis() {
    state.brandData = null;
    state.audienceData = null;
    state.contentData = null;
    state.ethicsData = null;

    ['step-2', 'step-3', 'step-4'].forEach((id) => {
        const loading = document.getElementById(`${id}-loading`);
        const results = document.getElementById(`${id}-results`);

        if (loading) {
            const texts = {
                'step-2': ['Hedef kitle analiz ediliyor...', 'Yapay zekâ demografik ve psikografik verileri inceliyor'],
                'step-3': ['İçerikler üretiliyor...', 'Yapay zekâ her segment için özgün içerikler oluşturuyor'],
                'step-4': ['Etik değerlendirme yapılıyor...', 'İçerikler etik standartlara göre analiz ediliyor'],
            };
            const [title, sub] = texts[id] || ['Yükleniyor...', ''];
            loading.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring spinner-ring--inner"></div>
                </div>
                <h3 class="loading-text">${title}</h3>
                <p class="loading-subtext">${sub}</p>
                <div class="loading-dots">
                    <span></span><span></span><span></span>
                </div>
            `;
            loading.style.display = 'block';
        }
        if (results) results.style.display = 'none';
    });

    const grids = ['segments-grid', 'segment-tabs', 'content-panels', 'ethics-dashboard'];
    grids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    showStep(1);
    showToast('Yeni analiz için hazır');
}

/* ═══════════════ TOAST ═══════════════ */

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.className = `toast toast--${type}`;
    const iconMap = { success: '✓', error: '✕', warning: '⚠' };
    const iconEl = toast.querySelector('.toast__icon');
    const textEl = toast.querySelector('.toast__text');

    if (iconEl) iconEl.textContent = iconMap[type] || '✓';
    if (textEl) textEl.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/* ═══════════════ UTILITIES ═══════════════ */

function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
