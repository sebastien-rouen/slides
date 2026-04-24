/**
 * slide-library.js — Bibliotheque d'images et modeles de slides
 * Panneau modal avec 2 onglets : Images / Modeles
 */

/* global SlideState, SlideEditor, renderAllSlides, goToSlide, DOMPurify */

const SlideLibrary = {
  overlayEl: null,
  panelEl: null,
  activeTab: 'presets',
  selectedImage: null,
  images: null,
  presets: null,

  init() {
    this.overlayEl = document.getElementById('slideLibraryOverlay');
    this.panelEl = document.getElementById('slideLibraryPanel');
    if (!this.overlayEl || !this.panelEl) return;

    // Bouton ouverture
    const btn = document.getElementById('libraryBtn');
    if (btn) btn.addEventListener('click', () => this.open());

    // Bouton fermer
    const closeBtn = this.panelEl.querySelector('.slide-library-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Fermer au clic sur l'overlay
    this.overlayEl.addEventListener('click', (e) => {
      if (e.target === this.overlayEl) this.close();
    });

    // Onglets
    this.panelEl.querySelectorAll('.slide-library-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Escape pour fermer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayEl.classList.contains('open')) {
        e.stopPropagation();
        this.close();
      }
    });
  },

  open() {
    this.overlayEl.classList.add('open');
    this.selectedImage = null;
    this.switchTab(this.activeTab);
  },

  close() {
    this.overlayEl.classList.remove('open');
    this.selectedImage = null;
    this.hidePreview();
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.panelEl.querySelectorAll('.slide-library-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    const content = this.panelEl.querySelector('.slide-library-content');
    if (tab === 'images') {
      this.renderImagesTab(content);
    } else {
      this.renderPresetsTab(content);
    }
  },

  // =============================================
  //  ONGLET IMAGES
  // =============================================

  async loadImages() {
    if (this.images) return this.images;
    try {
      const file = SlideEditor.filePath || '';
      const res = await fetch(`/api/routes-editor/images?file=${encodeURIComponent(file)}`);
      const data = await res.json();
      if (data.success) {
        this.images = data.data;
        return this.images;
      }
    } catch { /* erreur reseau */ }
    return { backgrounds: [], templates: [], presentation: [] };
  },

  async renderImagesTab(container) {
    container.textContent = '';

    // Zone d'upload
    const upload = this.createUploadZone();
    container.appendChild(upload);

    const images = await this.loadImages();

    // Zone actions (invisible au debut)
    const actions = document.createElement('div');
    actions.className = 'slide-library-img-actions';
    actions.id = 'libImageActions';

    const btnBg = document.createElement('button');
    btnBg.className = 'slide-library-img-action-btn primary';
    btnBg.textContent = 'Fond de slide';
    btnBg.addEventListener('click', () => this.applyAsBackground());

    const btnInsert = document.createElement('button');
    btnInsert.className = 'slide-library-img-action-btn';
    btnInsert.textContent = 'Dans le contenu';
    btnInsert.addEventListener('click', () => this.insertInContent());

    const btnNewSlide = document.createElement('button');
    btnNewSlide.className = 'slide-library-img-action-btn';
    btnNewSlide.textContent = 'Nouvelle slide';
    btnNewSlide.addEventListener('click', () => this.addSlideWithBackground());

    actions.append(btnBg, btnInsert, btnNewSlide);
    container.appendChild(actions);

    let hasAny = false;

    // Presentation courante
    if (images.presentation.length > 0) {
      hasAny = true;
      this.addSection(container, 'Cette presentation');
      this.addImageGrid(container, images.presentation);
    }

    // Fonds generiques
    if (images.backgrounds.length > 0) {
      hasAny = true;
      this.addSection(container, 'Fonds');
      this.addImageGrid(container, images.backgrounds);
    }

    // Templates
    if (images.templates.length > 0) {
      hasAny = true;
      const groups = {};
      images.templates.forEach(img => {
        const g = img.group || 'Autre';
        if (!groups[g]) groups[g] = [];
        groups[g].push(img);
      });
      for (const [group, imgs] of Object.entries(groups)) {
        this.addSection(container, `Template : ${group}`);
        this.addImageGrid(container, imgs);
      }
    }

    if (!hasAny) {
      const empty = document.createElement('div');
      empty.className = 'slide-library-empty';
      empty.textContent = 'Aucune image disponible. Utilisez le bouton ci-dessus pour uploader.';
      container.appendChild(empty);
    }
  },

  createUploadZone() {
    const zone = document.createElement('div');
    zone.className = 'slide-library-upload';
    zone.innerHTML = DOMPurify.sanitize(
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>' +
      '<polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
      ' Uploader une image (ou glisser-deposer)'
    );

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    zone.appendChild(input);

    zone.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        this.uploadAndRefresh(input.files[0]);
        input.value = '';
      }
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        this.uploadAndRefresh(files[0]);
      }
    });

    return zone;
  },

  async uploadAndRefresh(file) {
    if (typeof SlideEditor !== 'undefined' && SlideEditor.uploadImage) {
      await SlideEditor.uploadImage(file);
      // Invalider le cache et re-render l'onglet
      this.images = null;
      const content = this.panelEl.querySelector('.slide-library-content');
      this.renderImagesTab(content);
    }
  },

  addSection(container, title) {
    const el = document.createElement('div');
    el.className = 'slide-library-section';
    el.textContent = title;
    container.appendChild(el);
  },

  addImageGrid(container, images) {
    const grid = document.createElement('div');
    grid.className = 'slide-library-grid';

    images.forEach(img => {
      const card = document.createElement('div');
      card.className = 'slide-library-img-card';
      card.dataset.path = img.path;

      const imgEl = document.createElement('img');
      imgEl.src = img.path;
      imgEl.alt = img.name;
      imgEl.loading = 'lazy';
      card.appendChild(imgEl);

      const name = document.createElement('div');
      name.className = 'slide-library-img-name';
      name.textContent = img.name;
      card.appendChild(name);

      card.addEventListener('click', () => this.selectImage(card, img.path));
      grid.appendChild(card);
    });

    container.appendChild(grid);
  },

  selectImage(card, imgPath) {
    this.panelEl.querySelectorAll('.slide-library-img-card.selected')
      .forEach(c => c.classList.remove('selected'));

    card.classList.add('selected');
    this.selectedImage = imgPath;

    const actions = document.getElementById('libImageActions');
    if (actions) actions.classList.add('visible');

    // Callback pour AiSlideEditPanel si actif
    if (typeof this._aiEditCallback === 'function') {
      this._aiEditCallback(imgPath);
      this._aiEditCallback = null;
      this.close();
    }
  },

  // Actions sur image

  applyAsBackground() {
    if (!this.selectedImage) return;
    const directive = `<!-- style: background-image: url('${this.selectedImage}'); background-size: cover -->`;
    if (typeof SlideEditor !== 'undefined' && SlideEditor.textareaEl) {
      const textarea = SlideEditor.textareaEl;
      // Inserer en debut du contenu de la slide
      textarea.value = directive + '\n' + textarea.value;
      SlideEditor.onInput();
      SlideEditor.setStatus('modified', 'Fond applique');
    }
    this.close();
  },

  insertInContent() {
    if (!this.selectedImage) return;
    const md = `![Image](${this.selectedImage})`;
    if (typeof SlideEditor !== 'undefined' && SlideEditor.insertAtCursor) {
      SlideEditor.insertAtCursor(md);
      SlideEditor.setStatus('modified', 'Image inseree');
    }
    this.close();
  },

  async addSlideWithBackground() {
    if (!this.selectedImage) return;
    const content = `<!-- style: background-image: url('${this.selectedImage}'); background-size: cover -->\n## Titre\n\nContenu ici...`;
    await this.insertPresetSlide(content);
    this.close();
  },

  // =============================================
  //  ONGLET MODELES
  // =============================================

  async loadPresets() {
    if (this.presets) return this.presets;
    try {
      const res = await fetch('config/slide-presets.json?v=8');
      const data = await res.json();
      this.presets = data.presets || [];
    } catch {
      this.presets = [];
    }
    return this.presets;
  },

  async renderPresetsTab(container) {
    container.textContent = '';
    const presets = await this.loadPresets();

    if (presets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'slide-library-empty';
      empty.textContent = 'Aucun modèle disponible.';
      container.appendChild(empty);
      return;
    }

    // Barre de recherche
    const searchWrap = document.createElement('div');
    searchWrap.className = 'slide-library-search';
    const searchIcon = document.createElement('span');
    searchIcon.className = 'slide-library-search-icon';
    searchIcon.innerHTML = DOMPurify.sanitize('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Rechercher un modèle...';
    input.className = 'slide-library-search-input';
    input.setAttribute('autocomplete', 'off');
    searchWrap.append(searchIcon, input);
    container.appendChild(searchWrap);

    const contentArea = document.createElement('div');
    container.appendChild(contentArea);

    const render = (filter) => {
      contentArea.textContent = '';
      const q = filter.toLowerCase().trim();
      const filtered = q
        ? presets.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
          )
        : presets;

      if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'slide-library-empty';
        empty.textContent = 'Aucun modèle ne correspond à la recherche.';
        contentArea.appendChild(empty);
        return;
      }

      // Récents (uniquement sans filtre actif)
      if (!q) {
        const recentIds = this.getRecentPresets();
        const recent = recentIds.map(id => presets.find(p => p.id === id)).filter(Boolean);
        if (recent.length > 0) this.renderPresetSection(contentArea, '🕒 Récents', recent);
      }

      // Grouper par catégorie
      const catLabels = { basique: 'Basiques', layout: 'Layouts', data: 'Données', planning: 'Planning' };
      const catOrder = ['basique', 'layout', 'data', 'planning'];
      const groups = {};
      filtered.forEach(p => {
        const c = p.category || 'basique';
        if (!groups[c]) groups[c] = [];
        groups[c].push(p);
      });
      catOrder.forEach(cat => {
        if (groups[cat]?.length) this.renderPresetSection(contentArea, catLabels[cat] || cat, groups[cat]);
      });
      Object.keys(groups).filter(c => !catOrder.includes(c)).forEach(cat => {
        if (groups[cat].length) this.renderPresetSection(contentArea, cat, groups[cat]);
      });
    };

    input.addEventListener('input', () => render(input.value));
    render('');
  },

  renderPresetSection(container, title, presets) {
    const wrap = document.createElement('div');
    const titleEl = document.createElement('div');
    titleEl.className = 'slide-library-section';
    titleEl.textContent = title;
    wrap.appendChild(titleEl);
    const grid = document.createElement('div');
    grid.className = 'slide-library-presets';
    presets.forEach(p => grid.appendChild(this.createPresetCard(p)));
    wrap.appendChild(grid);
    container.appendChild(wrap);
  },

  createPresetCard(preset) {
    const card = document.createElement('div');
    card.className = 'slide-library-preset-card';
    if (preset.thumbnailId) card.classList.add('has-thumb');

    const iconEl = document.createElement('div');
    if (preset.thumbnailId) {
      iconEl.className = 'slide-library-preset-thumb';
      iconEl.innerHTML = DOMPurify.sanitize(this.getPresetThumbnail(preset.thumbnailId));
    } else {
      iconEl.className = 'slide-library-preset-icon';
      iconEl.innerHTML = DOMPurify.sanitize(this.getPresetIcon(preset.icon));
    }
    card.appendChild(iconEl);

    const name = document.createElement('div');
    name.className = 'slide-library-preset-name';
    name.textContent = preset.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'slide-library-preset-desc';
    desc.textContent = preset.description;
    card.appendChild(desc);

    if (preset.thumbnailId) {
      card.addEventListener('mouseenter', (e) => this.showPreview(e.currentTarget, preset.thumbnailId));
      card.addEventListener('mouseleave', () => this.hidePreview());
    }

    card.addEventListener('click', () => {
      this.addRecentPreset(preset.id);
      this.insertPresetSlide(preset.content);
      this.close();
    });

    return card;
  },

  // =============================================
  //  RÉCENTS & APERÇU AU SURVOL
  // =============================================

  getRecentPresets() {
    try {
      return JSON.parse(localStorage.getItem('slides-recent-presets') || '[]');
    } catch { return []; }
  },

  addRecentPreset(id) {
    const list = this.getRecentPresets().filter(r => r !== id);
    list.unshift(id);
    localStorage.setItem('slides-recent-presets', JSON.stringify(list.slice(0, 4)));
  },

  showPreview(card, thumbnailId) {
    let el = document.getElementById('slideLibPreview');
    if (!el) {
      el = document.createElement('div');
      el.id = 'slideLibPreview';
      el.className = 'slide-library-preview';
      document.body.appendChild(el);
    }
    el.innerHTML = DOMPurify.sanitize(this.getPresetThumbnail(thumbnailId));
    el.style.display = 'block';

    const rect = card.getBoundingClientRect();
    const pw = 420;
    const ph = Math.round(pw * 9 / 16) + 20; // padding inclus
    let left = rect.right + 10;
    if (left + pw > window.innerWidth - 8) left = rect.left - pw - 10;
    let top = rect.top + (rect.height / 2) - (ph / 2);
    top = Math.max(8, Math.min(top, window.innerHeight - ph - 8));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  },

  hidePreview() {
    const el = document.getElementById('slideLibPreview');
    if (el) el.style.display = 'none';
  },

  // =============================================
  //  INSERTION DE SLIDE
  // =============================================

  async insertPresetSlide(content) {
    if (typeof SlideState === 'undefined') return;
    const idx = SlideState.currentIndex;

    const { content: withoutNotes, notes } = typeof extractNotes === 'function'
      ? extractNotes(content) : { content, notes: '' };
    const { content: cleanContent, directives: dirs } = typeof extractDirectives === 'function'
      ? extractDirectives(withoutNotes) : { content: withoutNotes, directives: {} };

    const slide = {
      rawContent: content,
      notes: notes || '',
      layout: dirs.layout || (typeof detectLayout === 'function' ? detectLayout(cleanContent, idx + 1) : 'content'),
      cssClass: dirs.class || null,
      cssStyle: dirs.style || null,
      iframeUrl: dirs.url || null,
      positions: dirs.positions || null
    };

    SlideState.slides.splice(idx + 1, 0, slide);
    SlideState.totalSlides = SlideState.slides.length;

    const vp = document.getElementById('slideViewport');
    if (vp && typeof renderAllSlides === 'function') {
      await renderAllSlides(SlideState.slides, vp);
    }
    if (typeof goToSlide === 'function') goToSlide(idx + 1);

    // Animation pop-in
    const newSlide = document.querySelectorAll('.slide')[idx + 1];
    if (newSlide) {
      newSlide.classList.add('slide-created');
      newSlide.addEventListener('animationend',
        () => newSlide.classList.remove('slide-created'), { once: true });
    }

    if (typeof SlideEditor !== 'undefined') {
      SlideEditor.setStatus('modified', 'Slide ajoutee');
    }
  },

  // =============================================
  //  ICONES SVG pour les presets
  // =============================================

  getPresetThumbnail(id) {
    const B = '#0f172a'; const S = '#1e293b'; const T = '#e2e8f0'; const M = '#64748b'; const P = '#3b82f6';
    const thumbs = {
      title: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="40" y="38" width="120" height="12" rx="2.5" fill="${T}" opacity="0.9"/><rect x="60" y="56" width="80" height="6" rx="2" fill="${M}" opacity="0.6"/><rect x="85" y="70" width="30" height="3" rx="1" fill="${P}" opacity="0.5"/></svg>`,
      section: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="#1e1b4b" rx="4"/><rect x="45" y="44" width="110" height="11" rx="2.5" fill="${T}" opacity="0.9"/><rect x="70" y="62" width="60" height="3" rx="1" fill="${P}" opacity="0.6"/></svg>`,
      content: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="12" width="75" height="8" rx="2" fill="${T}" opacity="0.9"/><circle cx="18" cy="32" r="3" fill="${P}"/><rect x="26" y="29" width="90" height="5" rx="1.5" fill="${M}" opacity="0.7"/><circle cx="18" cy="45" r="3" fill="${P}"/><rect x="26" y="42" width="75" height="5" rx="1.5" fill="${M}" opacity="0.6"/><circle cx="18" cy="58" r="3" fill="${P}"/><rect x="26" y="55" width="82" height="5" rx="1.5" fill="${M}" opacity="0.55"/></svg>`,
      'two-columns': `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="12" width="65" height="8" rx="2" fill="${T}" opacity="0.9"/><circle cx="18" cy="32" r="2.5" fill="${P}"/><rect x="24" y="29" width="65" height="4" rx="1" fill="${M}" opacity="0.6"/><circle cx="18" cy="42" r="2.5" fill="${P}"/><rect x="24" y="39" width="55" height="4" rx="1" fill="${M}" opacity="0.55"/><circle cx="18" cy="52" r="2.5" fill="${P}"/><rect x="24" y="49" width="60" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="105" y="22" width="83" height="68" rx="3" fill="${S}"/><rect x="105" y="22" width="83" height="68" rx="3" fill="${P}" opacity="0.12"/><rect x="118" y="48" width="58" height="4" rx="1" fill="${M}" opacity="0.4"/><rect x="122" y="56" width="45" height="3" rx="1" fill="${M}" opacity="0.3"/></svg>`,
      quote: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="28" y="22" width="6" height="28" rx="2" fill="${P}" opacity="0.85"/><rect x="42" y="24" width="130" height="6" rx="2" fill="${T}" opacity="0.75"/><rect x="42" y="35" width="120" height="6" rx="2" fill="${T}" opacity="0.6"/><rect x="42" y="46" width="100" height="6" rx="2" fill="${T}" opacity="0.5"/><rect x="110" y="64" width="60" height="5" rx="2" fill="${M}" opacity="0.6"/></svg>`,
      code: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="60" height="7" rx="2" fill="${T}" opacity="0.9"/><rect x="12" y="24" width="176" height="74" rx="4" fill="${S}"/><rect x="20" y="32" width="35" height="4" rx="1" fill="${P}" opacity="0.8"/><rect x="58" y="32" width="55" height="4" rx="1" fill="${M}" opacity="0.55"/><rect x="20" y="42" width="28" height="4" rx="1" fill="#8b5cf6" opacity="0.8"/><rect x="52" y="42" width="72" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="20" y="52" width="45" height="4" rx="1" fill="#10b981" opacity="0.75"/><rect x="68" y="52" width="60" height="4" rx="1" fill="${M}" opacity="0.45"/><rect x="20" y="62" width="32" height="4" rx="1" fill="#f59e0b" opacity="0.7"/><rect x="56" y="62" width="42" height="4" rx="1" fill="${M}" opacity="0.4"/><rect x="20" y="76" width="18" height="4" rx="1" fill="${P}" opacity="0.5"/></svg>`,
      cover: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="#334155" rx="4"/><rect width="200" height="112" rx="4" fill="black" opacity="0.55"/><rect x="30" y="36" width="140" height="12" rx="2.5" fill="white" opacity="0.92"/><rect x="55" y="56" width="90" height="6" rx="2" fill="white" opacity="0.55"/></svg>`,
      comparison: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="65" height="7" rx="2" fill="${T}" opacity="0.9"/><rect x="12" y="26" width="85" height="74" rx="3" fill="${S}"/><rect x="12" y="26" width="85" height="74" rx="3" fill="#ef4444" opacity="0.07"/><rect x="20" y="33" width="40" height="5" rx="1.5" fill="#ef4444" opacity="0.75"/><rect x="20" y="44" width="4" height="4" rx="1" fill="${M}"/><rect x="28" y="44" width="55" height="4" rx="1" fill="${M}" opacity="0.55"/><rect x="20" y="53" width="4" height="4" rx="1" fill="${M}"/><rect x="28" y="53" width="45" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="103" y="26" width="85" height="74" rx="3" fill="${S}"/><rect x="103" y="26" width="85" height="74" rx="3" fill="#10b981" opacity="0.07"/><rect x="111" y="33" width="40" height="5" rx="1.5" fill="#10b981" opacity="0.75"/><rect x="111" y="44" width="4" height="4" rx="1" fill="#10b981" opacity="0.5"/><rect x="119" y="44" width="55" height="4" rx="1" fill="${M}" opacity="0.55"/><rect x="111" y="53" width="4" height="4" rx="1" fill="#10b981" opacity="0.5"/><rect x="119" y="53" width="45" height="4" rx="1" fill="${M}" opacity="0.5"/></svg>`,
      timeline: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="60" height="7" rx="2" fill="${T}" opacity="0.9"/><line x1="36" y1="28" x2="36" y2="98" stroke="${P}" stroke-width="2" opacity="0.35"/><circle cx="36" cy="33" r="6" fill="${P}"/><rect x="50" y="30" width="70" height="5" rx="1.5" fill="${T}" opacity="0.75"/><rect x="50" y="38" width="55" height="3.5" rx="1" fill="${M}" opacity="0.5"/><circle cx="36" cy="57" r="6" fill="#6366f1"/><rect x="50" y="54" width="80" height="5" rx="1.5" fill="${T}" opacity="0.7"/><rect x="50" y="62" width="60" height="3.5" rx="1" fill="${M}" opacity="0.45"/><circle cx="36" cy="81" r="6" fill="#8b5cf6"/><rect x="50" y="78" width="65" height="5" rx="1.5" fill="${T}" opacity="0.65"/><rect x="50" y="86" width="48" height="3.5" rx="1" fill="${M}" opacity="0.4"/></svg>`,
      diagram: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="65" height="7" rx="2" fill="${T}" opacity="0.9"/><rect x="72" y="24" width="56" height="18" rx="3" fill="${S}" stroke="${P}" stroke-width="1.5"/><rect x="80" y="30" width="40" height="5" rx="1" fill="${P}" opacity="0.6"/><rect x="18" y="60" width="56" height="18" rx="3" fill="${S}" stroke="#6366f1" stroke-width="1.5"/><rect x="26" y="66" width="40" height="5" rx="1" fill="#6366f1" opacity="0.6"/><rect x="126" y="60" width="56" height="18" rx="3" fill="${S}" stroke="#8b5cf6" stroke-width="1.5"/><rect x="134" y="66" width="40" height="5" rx="1" fill="#8b5cf6" opacity="0.6"/><line x1="100" y1="42" x2="46" y2="60" stroke="${M}" stroke-width="1.5"/><line x1="100" y1="42" x2="154" y2="60" stroke="${M}" stroke-width="1.5"/></svg>`,
      table: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="65" height="7" rx="2" fill="${T}" opacity="0.9"/><rect x="12" y="24" width="176" height="13" rx="2" fill="#1e3a5f" opacity="0.9"/><rect x="20" y="27" width="40" height="5" rx="1" fill="${P}" opacity="0.5"/><rect x="78" y="27" width="30" height="5" rx="1" fill="${M}" opacity="0.4"/><rect x="124" y="27" width="30" height="5" rx="1" fill="${M}" opacity="0.4"/><rect x="12" y="40" width="176" height="11" rx="1" fill="${S}" opacity="0.7"/><rect x="12" y="54" width="176" height="11" rx="1" fill="${S}" opacity="0.5"/><rect x="12" y="68" width="176" height="11" rx="1" fill="${S}" opacity="0.7"/><rect x="12" y="82" width="176" height="11" rx="1" fill="${S}" opacity="0.5"/><line x1="70" y1="24" x2="70" y2="93" stroke="#334155" stroke-width="1"/><line x1="126" y1="24" x2="126" y2="93" stroke="#334155" stroke-width="1"/></svg>`,
      end: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><circle cx="100" cy="44" r="22" fill="${P}" opacity="0.1"/><circle cx="100" cy="44" r="22" stroke="${P}" stroke-width="1.5" fill="none" opacity="0.3"/><rect x="58" y="38" width="84" height="12" rx="2.5" fill="${T}" opacity="0.9"/><rect x="72" y="58" width="56" height="7" rx="2" fill="${P}" opacity="0.65"/><rect x="52" y="73" width="96" height="5" rx="2" fill="${M}" opacity="0.45"/></svg>`,
      roadmap: `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="70" height="7" rx="2" fill="${P}" opacity="0.9"/><rect x="12" y="21" width="45" height="4" rx="1.5" fill="${M}" opacity="0.6"/><line x1="24" y1="65" x2="176" y2="65" stroke="${P}" stroke-width="2.5" opacity="0.4"/><circle cx="45" cy="65" r="11" fill="${P}"/><text x="45" y="69" text-anchor="middle" dominant-baseline="central" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">1</text><rect x="28" y="81" width="34" height="4" rx="1.5" fill="${T}" opacity="0.75"/><rect x="31" y="89" width="28" height="3" rx="1.5" fill="${M}" opacity="0.5"/><circle cx="90" cy="65" r="11" fill="#6366f1"/><text x="90" y="69" text-anchor="middle" dominant-baseline="central" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">2</text><rect x="73" y="81" width="34" height="4" rx="1.5" fill="${T}" opacity="0.75"/><rect x="76" y="89" width="28" height="3" rx="1.5" fill="${M}" opacity="0.5"/><circle cx="135" cy="65" r="11" fill="#8b5cf6"/><text x="135" y="69" text-anchor="middle" dominant-baseline="central" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">3</text><rect x="118" y="81" width="34" height="4" rx="1.5" fill="${T}" opacity="0.75"/><rect x="121" y="89" width="28" height="3" rx="1.5" fill="${M}" opacity="0.5"/><circle cx="178" cy="65" r="11" fill="#a855f7"/><text x="178" y="69" text-anchor="middle" dominant-baseline="central" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">4</text><rect x="161" y="81" width="34" height="4" rx="1.5" fill="${T}" opacity="0.75"/><rect x="164" y="89" width="28" height="3" rx="1.5" fill="${M}" opacity="0.5"/></svg>`,
      'roadmap-gantt': `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="12" y="10" width="70" height="7" rx="2" fill="${P}" opacity="0.9"/><rect x="12" y="24" width="30" height="5" rx="1" fill="${M}" opacity="0.5"/><rect x="46" y="24" width="36" height="5" rx="1" fill="${M}" opacity="0.5"/><rect x="86" y="24" width="36" height="5" rx="1" fill="${M}" opacity="0.5"/><rect x="126" y="24" width="36" height="5" rx="1" fill="${M}" opacity="0.5"/><line x1="12" y1="33" x2="188" y2="33" stroke="#334155" stroke-width="1"/><rect x="12" y="36" width="30" height="12" rx="1.5" fill="${S}"/><rect x="46" y="36" width="76" height="12" rx="2" fill="${P}" opacity="0.8"/><rect x="12" y="52" width="30" height="12" rx="1.5" fill="${S}"/><rect x="46" y="52" width="36" height="12" rx="2" fill="#6366f1" opacity="0.8"/><rect x="86" y="52" width="36" height="12" rx="2" fill="#8b5cf6" opacity="0.8"/><rect x="12" y="68" width="30" height="12" rx="1.5" fill="${S}"/><rect x="86" y="68" width="76" height="12" rx="2" fill="#0ea5e9" opacity="0.8"/><rect x="12" y="84" width="30" height="12" rx="1.5" fill="${S}"/><rect x="126" y="84" width="56" height="12" rx="2" fill="#10b981" opacity="0.8"/></svg>`,
      'roadmap-pmo': `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="50" y="7" width="100" height="6" rx="2" fill="${T}" opacity="0.8"/><rect x="6" y="20" width="26" height="18" rx="3" fill="${S}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><rect x="8" y="22" width="10" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="8" y="28" width="20" height="3" rx="1" fill="${M}" opacity="0.35"/><rect x="8" y="33" width="16" height="3" rx="1" fill="${M}" opacity="0.28"/><rect x="79" y="20" width="26" height="18" rx="3" fill="${S}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><rect x="81" y="22" width="10" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="81" y="28" width="20" height="3" rx="1" fill="${M}" opacity="0.35"/><rect x="81" y="33" width="16" height="3" rx="1" fill="${M}" opacity="0.28"/><rect x="152" y="20" width="26" height="18" rx="3" fill="${S}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><rect x="154" y="22" width="10" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="154" y="28" width="20" height="3" rx="1" fill="${M}" opacity="0.35"/><rect x="154" y="33" width="16" height="3" rx="1" fill="${M}" opacity="0.28"/><line x1="19" y1="38" x2="19" y2="44" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><line x1="92" y1="38" x2="92" y2="44" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><line x1="165" y1="38" x2="165" y2="44" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><rect x="3" y="44" width="27" height="11" rx="3" fill="#22c55e"/><rect x="34" y="44" width="27" height="11" rx="3" fill="#2563eb"/><rect x="65" y="44" width="27" height="11" rx="3" fill="#ef4444"/><rect x="96" y="44" width="27" height="11" rx="3" fill="#f59e0b"/><rect x="127" y="44" width="27" height="11" rx="3" fill="#f97316"/><rect x="158" y="44" width="27" height="11" rx="3" fill="#7c3aed"/><line x1="47" y1="55" x2="47" y2="61" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><rect x="34" y="61" width="26" height="18" rx="3" fill="${S}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/><rect x="36" y="63" width="10" height="4" rx="1" fill="${M}" opacity="0.5"/><rect x="36" y="69" width="20" height="3" rx="1" fill="${M}" opacity="0.35"/><rect x="36" y="74" width="16" height="3" rx="1" fill="${M}" opacity="0.28"/><path d="M0,92 C50,92 60,84 100,84 C140,84 150,98 200,98" stroke="#374151" stroke-width="7" fill="none"/><path d="M0,92 C50,92 60,84 100,84 C140,84 150,98 200,98" stroke="#4b5563" stroke-width="5" fill="none"/><path d="M0,92 C50,92 60,84 100,84 C140,84 150,98 200,98" stroke="white" stroke-width="1" fill="none" stroke-dasharray="8 5" stroke-opacity="0.4"/></svg>`,
      'scrum-sprint': `<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="112" fill="${B}" rx="4"/><rect x="40" y="6" width="120" height="6" rx="2" fill="${T}" opacity="0.8"/><rect x="4" y="17" width="92" height="9" rx="3" fill="rgba(59,130,246,0.2)" stroke="rgba(59,130,246,0.4)" stroke-width="0.5"/><rect x="100" y="17" width="96" height="9" rx="3" fill="rgba(16,185,129,0.2)" stroke="rgba(16,185,129,0.4)" stroke-width="0.5"/><rect x="4" y="31" width="14" height="15" rx="2" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" stroke-width="0.5"/><rect x="78" y="31" width="14" height="15" rx="2" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" stroke-width="0.5"/><rect x="100" y="31" width="14" height="15" rx="2" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" stroke-width="0.5"/><rect x="178" y="31" width="16" height="15" rx="2" fill="rgba(249,115,22,0.15)" stroke="rgba(249,115,22,0.4)" stroke-width="0.5"/><line x1="11" y1="46" x2="11" y2="51" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="85" y1="46" x2="85" y2="51" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="107" y1="46" x2="107" y2="51" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><line x1="186" y1="46" x2="186" y2="51" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/><rect x="4" y="51" width="14" height="7" rx="2" fill="rgba(59,130,246,0.1)"/><rect x="22" y="51" width="14" height="7" rx="2" fill="rgba(59,130,246,0.1)"/><rect x="40" y="51" width="14" height="7" rx="2" fill="rgba(59,130,246,0.1)"/><rect x="58" y="51" width="14" height="7" rx="2" fill="rgba(59,130,246,0.1)"/><rect x="76" y="51" width="14" height="7" rx="2" fill="rgba(59,130,246,0.1)"/><rect x="96" y="51" width="14" height="7" rx="2" fill="rgba(16,185,129,0.1)"/><rect x="114" y="51" width="14" height="7" rx="2" fill="rgba(16,185,129,0.1)"/><rect x="132" y="51" width="14" height="7" rx="2" fill="rgba(16,185,129,0.1)"/><rect x="150" y="51" width="14" height="7" rx="2" fill="rgba(16,185,129,0.1)"/><rect x="168" y="51" width="16" height="7" rx="2" fill="rgba(16,185,129,0.1)"/><path d="M0,74 C50,74 60,66 100,66 C140,66 150,80 200,80" stroke="#374151" stroke-width="7" fill="none"/><path d="M0,74 C50,74 60,66 100,66 C140,66 150,80 200,80" stroke="#4b5563" stroke-width="5" fill="none"/><path d="M0,74 C50,74 60,66 100,66 C140,66 150,80 200,80" stroke="white" stroke-width="1" fill="none" stroke-dasharray="8 5" stroke-opacity="0.4"/><rect x="34" y="88" width="18" height="18" rx="2" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.35)" stroke-width="0.5"/><rect x="130" y="88" width="18" height="18" rx="2" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.35)" stroke-width="0.5"/></svg>`
    };
    return thumbs[id] || '';
  },

  getPresetIcon(name) {
    const icons = {
      heading: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12M6 4v16M18 4v16"/></svg>',
      bookmark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>',
      'align-left': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
      columns: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/></svg>',
      'message-circle': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>',
      code: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      image: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      'git-pull-request': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>',
      clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'share-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
      heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>'
    };
    return icons[name] || icons['align-left'];
  }
};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => SlideLibrary.init(), 200);
});
