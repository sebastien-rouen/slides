/**
 * ai-slides.js — Génération & édition IA de présentations
 *
 * AiSlides         : modal de génération sur index.html
 * AiSlidesEditor   : modal d'insertion de slides IA (viewer.html) — #aiEditSlideBtn
 * AiSlideEditPanel : panneau d'édition IA de la slide courante (viewer.html) — fmt-btn[data-action="ai-generate"]
 */

/* ===== SHARED ===== */

function buildSlidePrompt({ sujet, public: pub, nbSlides, style, langue, contexte }) {
    const parts = [];
    parts.push(`Crée une présentation sur : ${sujet}`);
    if (pub) parts.push(`Public cible : ${pub}`);
    parts.push(`Nombre de slides : ${nbSlides}`);
    if (style) parts.push(`Style : ${style}`);
    if (langue) parts.push(`Langue : ${langue}`);
    if (contexte && contexte.trim()) parts.push(`Contexte supplémentaire : ${contexte.trim()}`);
    return parts.join('\n');
}

/* ===== INDEX.HTML ===== */

const AI_LOADING_MESSAGES = [
    'Analyse du sujet...',
    'Structuration du plan...',
    'Rédaction des slides...',
    'Mise en forme du contenu...',
    'Ajout des exemples...',
    'Finalisation de la présentation...',
    'Presque terminé...',
];

const AiSlides = {
    dialogEl: null,
    promptEl: null,
    errorEl: null,
    generateBtn: null,
    loadingOverlay: null,
    loadingStatus: null,
    _loadingMsgTimer: null,
    _loadingMsgIndex: 0,

    init() {
        this.dialogEl = document.getElementById('aiSlidesModal');
        this.promptEl = document.getElementById('aiSlidesPrompt');
        this.errorEl = document.getElementById('aiSlidesError');
        this.generateBtn = document.getElementById('btnAiGenerate');
        this.loadingOverlay = document.getElementById('aiLoadingOverlay');
        this.loadingStatus = document.getElementById('aiLoadingStatus');

        if (!this.dialogEl) return;

        const openBtn = document.getElementById('btnAiSlides');
        if (openBtn) openBtn.addEventListener('click', () => this.open());

        ['btnAiCancel', 'btnAiModalClose'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', () => this.close());
        });

        this.dialogEl.addEventListener('click', e => {
            if (e.target === this.dialogEl) this.close();
        });

        if (this.generateBtn) this.generateBtn.addEventListener('click', () => this.generate());

        this.dialogEl.querySelectorAll('.ai-chip[data-group="style"]').forEach(chip => {
            chip.addEventListener('click', () => this._selectChip('style', chip));
        });
        this.dialogEl.querySelectorAll('.ai-chip[data-group="langue"]').forEach(chip => {
            chip.addEventListener('click', () => this._selectChip('langue', chip));
        });

        ['aiSujet', 'aiPublic', 'aiNbSlides', 'aiContexte'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this._updatePrompt());
        });
    },

    open() {
        this._updatePrompt();
        this.dialogEl.showModal();
        document.getElementById('aiSujet')?.focus();
    },

    close() {
        this.dialogEl.close();
        this._clearError();
    },

    _selectChip(group, target) {
        this.dialogEl.querySelectorAll(`.ai-chip[data-group="${group}"]`).forEach(c => {
            c.classList.toggle('is-selected', c === target);
        });
        this._updatePrompt();
    },

    _getSelected(group) {
        const chip = this.dialogEl.querySelector(`.ai-chip[data-group="${group}"].is-selected`);
        return chip ? chip.dataset.value : '';
    },

    _updatePrompt() {
        if (!this.promptEl) return;
        const sujet    = document.getElementById('aiSujet')?.value.trim() || '';
        const pub      = document.getElementById('aiPublic')?.value.trim() || '';
        const nbSlides = document.getElementById('aiNbSlides')?.value || '8';
        const style    = this._getSelected('style');
        const langue   = this._getSelected('langue') || 'Français';
        const contexte = document.getElementById('aiContexte')?.value || '';
        this.promptEl.value = buildSlidePrompt({ sujet, public: pub, nbSlides, style, langue, contexte });
    },

    async generate() {
        const prompt = this.promptEl?.value.trim();
        const title  = document.getElementById('aiSujet')?.value.trim();

        if (!title || title.length < 3) {
            this._showError('Saisissez un sujet (au moins 3 caractères).');
            document.getElementById('aiSujet')?.focus();
            return;
        }
        if (!prompt || prompt.length < 10) {
            this._showError('Le prompt est trop court.');
            return;
        }

        this._clearError();
        this._setLoading(true);

        try {
            const response = await fetch('/api/routes-ai-slides/generate-and-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    title,
                    tags: ['ia']
                })
            });
            const result = await response.json();

            if (!result.success) {
                this._showError(result.error || 'Erreur lors de la génération.');
                return;
            }

            window.location.href = `viewer.html?file=${encodeURIComponent(result.data.file)}`;

        } catch {
            this._showError('Erreur réseau. Vérifiez votre connexion.');
            this._setLoading(false);
        }
    },

    _setLoading(on) {
        if (!this.generateBtn) return;
        this.generateBtn.classList.toggle('is-loading', on);
        this.generateBtn.disabled = on;

        if (on) {
            this._loadingMsgIndex = 0;
            if (this.loadingStatus) this.loadingStatus.textContent = AI_LOADING_MESSAGES[0];
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.add('is-active');
                this.loadingOverlay.removeAttribute('aria-hidden');
            }
            this._loadingMsgTimer = setInterval(() => {
                if (this._loadingMsgIndex >= AI_LOADING_MESSAGES.length - 1) return;
                this._loadingMsgIndex++;
                if (this.loadingStatus) {
                    this.loadingStatus.style.animation = 'none';
                    void this.loadingStatus.offsetWidth;
                    this.loadingStatus.style.animation = '';
                    this.loadingStatus.textContent = AI_LOADING_MESSAGES[this._loadingMsgIndex];
                }
            }, 2200);
        } else {
            clearInterval(this._loadingMsgTimer);
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.remove('is-active');
                this.loadingOverlay.setAttribute('aria-hidden', 'true');
            }
        }
    },

    _showError(msg) {
        if (!this.errorEl) return;
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('is-visible');
    },

    _clearError() {
        if (!this.errorEl) return;
        this.errorEl.textContent = '';
        this.errorEl.classList.remove('is-visible');
    }
};

/* ===== VIEWER.HTML — Insertion de slides IA (modal #aiInsertSlidesModal) ===== */

const AiSlidesEditor = {
    dialogEl: null,
    promptEl: null,
    errorEl: null,
    generateBtn: null,
    openBtn: null,

    init() {
        this.dialogEl    = document.getElementById('aiInsertSlidesModal');
        this.promptEl    = document.getElementById('aiInsertPrompt');
        this.errorEl     = document.getElementById('aiInsertError');
        this.generateBtn = document.getElementById('btnAiInsertGenerate');
        this.openBtn     = document.getElementById('aiEditSlideBtn');

        if (!this.dialogEl) return;

        this.openBtn?.addEventListener('click', () => this.open());

        ['btnAiInsertClose', 'btnAiInsertCancel'].forEach(id => {
            document.getElementById(id)?.addEventListener('click', () => this.close());
        });

        this.dialogEl.addEventListener('click', e => {
            if (e.target === this.dialogEl) this.close();
        });

        this.generateBtn?.addEventListener('click', () => this.generate());

        this.dialogEl.querySelectorAll('.ai-chip[data-group="insert-style"]').forEach(chip => {
            chip.addEventListener('click', () => this._selectChip('insert-style', chip));
        });
        this.dialogEl.querySelectorAll('.ai-chip[data-group="insert-langue"]').forEach(chip => {
            chip.addEventListener('click', () => this._selectChip('insert-langue', chip));
        });

        ['aiInsertSujet', 'aiInsertPublic', 'aiInsertNbSlides', 'aiInsertContexte'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this._updatePrompt());
        });
    },

    open() {
        this._updatePrompt();
        this.openBtn?.classList.add('is-active');
        this.dialogEl.showModal();
        document.getElementById('aiInsertSujet')?.focus();
    },

    close() {
        this.dialogEl.close();
        this.openBtn?.classList.remove('is-active');
        this._clearError();
    },

    _selectChip(group, target) {
        this.dialogEl.querySelectorAll(`.ai-chip[data-group="${group}"]`).forEach(c => {
            c.classList.toggle('is-selected', c === target);
        });
        this._updatePrompt();
    },

    _getSelected(group) {
        const chip = this.dialogEl.querySelector(`.ai-chip[data-group="${group}"].is-selected`);
        return chip ? chip.dataset.value : '';
    },

    _updatePrompt() {
        if (!this.promptEl) return;
        const sujet    = document.getElementById('aiInsertSujet')?.value.trim() || '';
        const pub      = document.getElementById('aiInsertPublic')?.value.trim() || '';
        const nbSlides = document.getElementById('aiInsertNbSlides')?.value || '6';
        const style    = this._getSelected('insert-style');
        const langue   = this._getSelected('insert-langue') || 'Français';
        const contexte = document.getElementById('aiInsertContexte')?.value || '';
        this.promptEl.value = buildSlidePrompt({ sujet, public: pub, nbSlides, style, langue, contexte });
    },

    async generate() {
        const prompt = this.promptEl?.value.trim();
        if (!prompt || prompt.length < 10) {
            this._showError('Saisissez un prompt avant de générer.');
            return;
        }

        this._clearError();
        this._setLoading(true);

        try {
            const response = await fetch('/api/routes-ai-slides/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const result = await response.json();

            if (!result.success) {
                this._showError(result.error || 'Erreur lors de la génération.');
                return;
            }

            this._insertMarkdown(result.data.markdown);
            this.close();

        } catch {
            this._showError('Erreur réseau. Vérifiez votre connexion.');
        } finally {
            this._setLoading(false);
        }
    },

    _insertMarkdown(markdown) {
        const ta = SlideEditor.textareaEl;
        if (!ta) return;

        const separator = '\n\n---\n\n';
        const current   = ta.value;
        const insertion = current.trim() ? separator + markdown : markdown;

        const start = ta.selectionStart;
        const end   = ta.selectionEnd;
        const atEnd = start === end && start >= current.trimEnd().length;

        if (atEnd || start === current.length) {
            ta.value = current.trimEnd() + insertion;
        } else {
            ta.value = current.slice(0, start) + insertion + current.slice(end);
        }

        ta.dispatchEvent(new Event('input'));
    },

    _setLoading(on) {
        if (!this.generateBtn) return;
        this.generateBtn.classList.toggle('is-loading', on);
        this.generateBtn.disabled = on;
    },

    _showError(msg) {
        if (!this.errorEl) return;
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('is-visible');
    },


    _clearError() {
        if (!this.errorEl) return;
        this.errorEl.textContent = '';
        this.errorEl.classList.remove('is-visible');
    }
};

/* ===== VIEWER.HTML — Édition IA de la slide courante (fmt-btn[data-action="ai-generate"]) ===== */

const AiSlideEditPanel = {
    panelEl: null,
    promptEl: null,
    errorEl: null,
    imageUrlEl: null,
    presetSelectEl: null,
    generateBtn: null,
    fmtBtn: null,
    isOpen: false,
    _presets: null,

    init() {
        this.panelEl        = document.getElementById('aiEditSlidePanel');
        this.promptEl       = document.getElementById('aiEditPrompt');
        this.errorEl        = document.getElementById('aiEditError');
        this.imageUrlEl     = document.getElementById('aiEditImageUrl');
        this.presetSelectEl = document.getElementById('aiEditPreset');
        this.generateBtn    = document.getElementById('btnAiEditGenerate');
        this.fmtBtn         = document.querySelector('.fmt-btn[data-action="ai-generate"]');

        if (!this.panelEl) return;

        this.fmtBtn?.addEventListener('click', () => this.toggle());
        document.getElementById('aiEditCloseBtn')?.addEventListener('click', () => this.close());
        document.getElementById('btnAiEditCancel')?.addEventListener('click', () => this.close());
        this.generateBtn?.addEventListener('click', () => this.generate());

        // Chips layout
        this.panelEl.querySelectorAll('.ai-chip[data-group="edit-layout"]').forEach(chip => {
            chip.addEventListener('click', () => {
                this.panelEl.querySelectorAll('.ai-chip[data-group="edit-layout"]')
                    .forEach(c => c.classList.toggle('is-selected', c === chip));
            });
        });

        // Bouton Pexels auto : cherche depuis les mots du prompt
        document.getElementById('aiEditPexelsBtn')?.addEventListener('click', () => this._searchPexels());

        // Bouton galerie → ouvre SlideLibrary
        const galleryHandler = () => {
            if (typeof SlideLibrary === 'undefined') return;
            SlideLibrary._aiEditCallback = (url) => this._setImage(url);
            SlideLibrary.open();
            SlideLibrary.switchTab('images');
        };
        document.getElementById('aiEditGalleryBtn')?.addEventListener('click', galleryHandler);
        document.getElementById('aiEditImgChangeBtn')?.addEventListener('click', galleryHandler);

        // Bouton effacer
        document.getElementById('aiEditImgClearBtn')?.addEventListener('click', () => this._setImage(''));
    },

    _setImage(url) {
        if (this.imageUrlEl) this.imageUrlEl.value = url;
        const empty  = document.getElementById('aiEditImgEmpty');
        const filled = document.getElementById('aiEditImgFilled');
        const thumb  = document.getElementById('aiEditImgThumb');
        if (!empty || !filled) return;
        if (url) {
            thumb.src = url;
            empty.classList.add('hidden');
            filled.classList.remove('hidden');
        } else {
            thumb.src = '';
            filled.classList.add('hidden');
            empty.classList.remove('hidden');
        }
    },

    async _searchPexels() {
        const prompt = this.promptEl?.value.trim() || '';
        // Extraire les mots significatifs du prompt comme query
        const stopFr = new Set(['le','la','les','un','une','des','de','du','en','et','ou','est','avec','pour','par','sur','dans','sans','que','qui','ça','ce','cet','plus','moins','très','aussi']);
        const words = prompt.toLowerCase()
            .replace(/[^a-zàâéèêëîïôùûüç\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopFr.has(w))
            .slice(0, 4);
        const q = words.join(' ') || prompt.substring(0, 60);
        if (!q) return;

        const btn = document.getElementById('aiEditPexelsBtn');
        if (btn) btn.classList.add('is-loading');
        try {
            const res  = await fetch(`/api/routes-ai-slides/image-search?${new URLSearchParams({ q })}`);
            const data = await res.json();
            if (data.success) this._setImage(data.data.url);
            else this._showError('Aucune image Pexels trouvée pour ce prompt.');
        } catch {
            this._showError('Erreur réseau Pexels.');
        } finally {
            if (btn) btn.classList.remove('is-loading');
        }
    },

    toggle() { this.isOpen ? this.close() : this.open(); },

    open() {
        this.isOpen = true;
        this.panelEl.classList.add('is-open');
        if (this.fmtBtn) this.fmtBtn.classList.add('is-active');
        this.promptEl?.focus();
    },

    close() {
        this.isOpen = false;
        this.panelEl.classList.remove('is-open');
        if (this.fmtBtn) this.fmtBtn.classList.remove('is-active');
        this._clearError();
    },

    _getSelectedLayout() {
        const chip = this.panelEl.querySelector('.ai-chip[data-group="edit-layout"].is-selected');
        return chip ? chip.dataset.value : '';
    },

    async _getPresetContent(id) {
        if (!id) return '';
        if (!this._presets) {
            try {
                const res  = await fetch('config/slide-presets.json?v=8');
                const data = await res.json();
                this._presets = data.presets || [];
            } catch { this._presets = []; }
        }
        return this._presets.find(p => p.id === id)?.content || '';
    },

    async generate() {
        const prompt = this.promptEl?.value.trim();
        if (!prompt || prompt.length < 3) {
            this._showError('Décrivez ce que vous souhaitez modifier.');
            return;
        }

        const currentSlide = SlideEditor?.textareaEl?.value || '';
        if (!currentSlide.trim()) {
            this._showError('La slide courante est vide.');
            return;
        }

        const layout = this._getSelectedLayout();
        let fullPrompt = prompt;
        if (layout) fullPrompt += `\nApplique le layout "${layout}".`;

        const imageUrl      = this.imageUrlEl?.value.trim() || '';
        const presetId      = this.presetSelectEl?.value || '';
        const presetContent = await this._getPresetContent(presetId);

        this._clearError();
        this._setLoading(true);

        try {
            const res = await fetch('/api/routes-ai-slides/edit-slide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentSlide, prompt: fullPrompt, imageUrl, presetContent })
            });
            const result = await res.json();

            if (!result.success) {
                this._showError(result.error || 'Erreur lors de la modification.');
                return;
            }

            if (SlideEditor?.textareaEl) {
                SlideEditor.textareaEl.value = result.data.markdown;
                SlideEditor.textareaEl.dispatchEvent(new Event('input'));
            }
            this._setImage('');
            this.close();

        } catch {
            this._showError('Erreur réseau. Vérifiez votre connexion.');
        } finally {
            this._setLoading(false);
        }
    },

    _setLoading(on) {
        if (!this.generateBtn) return;
        this.generateBtn.classList.toggle('is-loading', on);
        this.generateBtn.disabled = on;
        const pexelsBtn = document.getElementById('aiEditPexelsBtn');
        if (pexelsBtn) pexelsBtn.disabled = on;
    },

    _showError(msg) {
        if (!this.errorEl) return;
        this.errorEl.textContent = msg;
        this.errorEl.classList.add('is-visible');
    },

    _clearError() {
        if (!this.errorEl) return;
        this.errorEl.textContent = '';
        this.errorEl.classList.remove('is-visible');
    }
};
