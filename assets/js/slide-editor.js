/**
 * slide-editor.js — Editeur Markdown inline pour les slides
 */

/* Echappement HTML pour l'overlay de coloration syntaxique */
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Actions de formatage : chaque action definit comment modifier le texte */
const FORMAT_ACTIONS = {
  bold:        { wrap: '**',  placeholder: 'texte en gras' },
  italic:      { wrap: '*',   placeholder: 'texte en italique' },
  heading:     { prefix: '## ', placeholder: 'Titre' },
  link:        { template: '[${text}](url)', placeholder: 'texte du lien' },
  'image-bg':  { block: '<!-- layout: cover -->', replace: true },
  'image-left':{ block: '<!-- layout: image-left -->', replace: true },
  'image-right':{ block: '<!-- layout: image-right -->', replace: true },
  'iframe':    { block: '<!-- layout: iframe-right -->\n<!-- url: https://example.com -->', replace: true },
  code:        { wrap: '`',   placeholder: 'code' },
  codeblock:   { block: '```\n${text}\n```', placeholder: 'code ici' },
  'mermaid-flowchart': { block: '```mermaid\ngraph TD\n  A[Debut] --> B{Decision}\n  B -->|Oui| C[Action 1]\n  B -->|Non| D[Action 2]\n  C --> E[Fin]\n  D --> E\n```' },
  'mermaid-sequence':  { block: '```mermaid\nsequenceDiagram\n  participant U as Utilisateur\n  participant S as Serveur\n  U->>S: Requete\n  S-->>U: Reponse\n```' },
  'mermaid-class':     { block: '```mermaid\nclassDiagram\n  class Animal {\n    +String nom\n    +manger()\n  }\n  class Chat {\n    +miauler()\n  }\n  Animal <|-- Chat\n```' },
  'mermaid-state':     { block: '```mermaid\nstateDiagram-v2\n  [*] --> Inactif\n  Inactif --> Actif : demarrer\n  Actif --> Inactif : arreter\n  Actif --> [*] : terminer\n```' },
  'mermaid-er':        { block: '```mermaid\nerDiagram\n  UTILISATEUR ||--o{ COMMANDE : passe\n  COMMANDE ||--|{ PRODUIT : contient\n```' },
  'mermaid-gantt':     { block: '```mermaid\ngantt\n  title Planning\n  dateFormat YYYY-MM-DD\n  section Phase 1\n    Tache 1 :a1, 2026-01-01, 30d\n    Tache 2 :after a1, 20d\n  section Phase 2\n    Tache 3 :2026-02-15, 25d\n```' },
  'mermaid-pie':       { block: '```mermaid\npie title Repartition\n  "Categorie A" : 40\n  "Categorie B" : 35\n  "Categorie C" : 25\n```' },
  'mermaid-mindmap':   { block: '```mermaid\nmindmap\n  root((Sujet))\n    Branche 1\n      Detail A\n      Detail B\n    Branche 2\n      Detail C\n    Branche 3\n```' },
  list:        { prefix: '- ', placeholder: 'element' },
  quote:       { prefix: '> ', placeholder: 'citation' },
  'align-left':   { block: '<div style="text-align:left">\n${text}\n</div>', placeholder: 'texte aligne a gauche' },
  'align-center': { block: '<div style="text-align:center">\n${text}\n</div>', placeholder: 'texte centre' },
  'align-right':  { block: '<div style="text-align:right">\n${text}\n</div>', placeholder: 'texte aligne a droite' }
};

const SlideEditor = {
  isActive: false,
  filePath: '',
  originalFullMarkdown: '',
  panelEl: null,
  textareaEl: null,
  notesTextareaEl: null,
  statusDotEl: null,
  statusTextEl: null,
  saveBtn: null,
  highlightPreEl: null,
  highlightCodeEl: null,
  debouncedPreview: null,

  init() {
    this.panelEl = document.getElementById('slideEditorPanel');
    this.textareaEl = document.getElementById('slideEditorTextarea');
    this.notesTextareaEl = document.getElementById('slideEditorNotes');
    this.statusDotEl = document.getElementById('editorStatusDot');
    this.statusTextEl = document.getElementById('editorStatusText');
    this.saveBtn = document.getElementById('editorSaveBtn');
    this.highlightPreEl = document.getElementById('editorHighlightPre');
    this.highlightCodeEl = document.getElementById('editorHighlightCode');

    // Recuperer le chemin du fichier depuis l'URL
    this.filePath = getUrlParam('file') || '';

    this.debouncedPreview = debounce(() => this.updatePreview(), 300);
    this.bindEvents();

    // Auto-ouverture si ?editor=1 dans l'URL (apres creation)
    if (getUrlParam('editor') === '1') {
      setTimeout(() => this.toggle(), 300);
    }
  },

  bindEvents() {
    const toggleBtn = document.getElementById('editorBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    if (this.textareaEl) {
      this.textareaEl.addEventListener('input', () => {
        this.setStatus('modified', 'Modifie');
        this.highlightSyntax();
        this.debouncedPreview();
      });

      // Notes textarea : maj status + sync rawContent
      if (this.notesTextareaEl) {
        this.notesTextareaEl.addEventListener('input', () => {
          this.setStatus('modified', 'Modifie');
          this.syncNotesToRawContent();
        });
      }

      // Sync scroll textarea -> pre overlay
      if (this.highlightPreEl) {
        this.textareaEl.addEventListener('scroll', () => {
          this.highlightPreEl.scrollTop = this.textareaEl.scrollTop;
          this.highlightPreEl.scrollLeft = this.textareaEl.scrollLeft;
        });
      }

      this.textareaEl.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); this.insertAtCursor('  '); }
        if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.applyFormat('bold'); }
        if (e.key === 'i' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.applyFormat('italic'); }
      });

      // Drag & drop d'images sur le textarea
      this.textareaEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        this.textareaEl.classList.add('dragover');
      });
      this.textareaEl.addEventListener('dragleave', () => {
        this.textareaEl.classList.remove('dragover');
      });
      this.textareaEl.addEventListener('drop', (e) => {
        e.preventDefault();
        this.textareaEl.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          this.uploadImage(files[0]);
        }
      });

      // Coller une image depuis le presse-papier
      this.textareaEl.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) this.uploadImage(file);
            return;
          }
        }
      });
    }

    // Bouton upload image dans la toolbar
    const uploadBtn = document.getElementById('editorUploadBtn');
    if (uploadBtn) {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      uploadBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          this.uploadImage(fileInput.files[0]);
          fileInput.value = '';
        }
      });
    }

    if (this.saveBtn) {
      this.saveBtn.addEventListener('click', () => this.save());
    }

    const cancelBtn = document.getElementById('editorCancelBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.deactivate());
    }

    // Ctrl+S global quand l'editeur est actif
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.save(); }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.duplicateSlide(); }
    });

    const dupBtn = document.getElementById('editorDuplicateBtn');
    if (dupBtn) dupBtn.addEventListener('click', () => this.duplicateSlide());

    // Slider opacite du fond
    const opSlider = document.getElementById('bgOpacitySlider');
    if (opSlider) {
      opSlider.addEventListener('input', () => {
        const el = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"] .slide-bg-layer`);
        if (el) el.style.opacity = opSlider.value / 100;
      });
      opSlider.addEventListener('change', () => this.commitBgOpacity(opSlider.value / 100));
    }

    // Barre de formatage : delegation d'evenement
    const formatBar = this.panelEl?.querySelector('.slide-editor-format-bar');
    if (formatBar) {
      formatBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.fmt-btn');
        if (!btn) return;
        const action = btn.dataset.action;
        // Le bouton mermaid-toggle ouvre/ferme le dropdown
        if (action === 'mermaid-toggle') {
          e.stopPropagation();
          const menu = document.getElementById('mermaidMenu');
          if (menu) menu.classList.toggle('open');
          return;
        }
        if (action === 'color-toggle') {
          e.stopPropagation();
          const menu = document.getElementById('colorMenu');
          if (menu) menu.classList.toggle('open');
          return;
        }
        if (action === 'position') {
          const s = SlideState.slides[SlideState.currentIndex];
          const el = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
          if (s && el && !s.positions && typeof this.computeInitialPositions === 'function') this.computeInitialPositions(el);
          return;
        }
        if (action) this.applyFormat(action);
      });

      // Clic sur un type de diagramme Mermaid dans le dropdown
      const mermaidMenu = document.getElementById('mermaidMenu');
      if (mermaidMenu) {
        mermaidMenu.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-mermaid]');
          if (!btn) return;
          e.stopPropagation();
          const type = btn.dataset.mermaid;
          this.applyFormat('mermaid-' + type);
          mermaidMenu.classList.remove('open');
        });
      }

      // Clic sur une couleur preset dans le dropdown
      const colorMenu = document.getElementById('colorMenu');
      if (colorMenu) {
        colorMenu.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-color]');
          if (!btn) return;
          e.stopPropagation();
          this.applyColorWrap(btn.dataset.color);
          colorMenu.classList.remove('open');
        });
      }

      // Clic sur le bouton Appliquer du color picker
      const colorApplyBtn = document.getElementById('colorPickerApply');
      if (colorApplyBtn) {
        colorApplyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const picker = document.getElementById('colorPickerInput');
          if (picker) this.applyColorWrap(picker.value);
          const menu = document.getElementById('colorMenu');
          if (menu) menu.classList.remove('open');
        });
      }
    }

    // Fermer les dropdowns sur clic exterieur
    document.addEventListener('click', (e) => {
      const mMenu = document.getElementById('mermaidMenu');
      if (mMenu && mMenu.classList.contains('open') && !e.target.closest('#mermaidDropdown')) {
        mMenu.classList.remove('open');
      }
      const cMenu = document.getElementById('colorMenu');
      if (cMenu && cMenu.classList.contains('open') && !e.target.closest('#colorDropdown')) {
        cMenu.classList.remove('open');
      }
    });

    // Clic simple sur la slide active -> focus dans le textarea
    // (ignore si le clic est sur un bloc positionne en mode drag)
    const viewport = document.getElementById('slideViewport');
    if (viewport) {
      viewport.addEventListener('click', (e) => {
        if (!this.isActive || !this.textareaEl) return;

        // Ne pas intercepter les clics sur les blocs positionnables (gere par slide-drag-position)
        if (e.target.closest('.slide-pos-block')) return;

        // Trouver l'element clique le plus proche avec du texte
        const target = e.target.closest('h1, h2, h3, h4, p, li, blockquote, td, th, strong, em, code, a, span');
        if (!target) return;

        // Extraire le texte brut de l'element
        const clickedText = target.textContent.trim();
        if (clickedText.length < 2) return;

        this.focusTextInEditor(clickedText);
      });
    }
  },

  focusTextInEditor(clickedText) {
    if (!this.textareaEl || !clickedText) return;

    const source = this.textareaEl.value;

    // Chercher le texte directement
    let idx = source.indexOf(clickedText);

    if (idx === -1) {
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const stripped = lines[i].replace(/[*_`#>!\[\]()]/g, '').trim();
        if (stripped.includes(clickedText) || clickedText.includes(stripped) && stripped.length >= 3) {
          idx = source.indexOf(lines[i]); break;
        }
      }
    }
    if (idx === -1) {
      for (const word of clickedText.split(/\s+/).filter(w => w.length >= 3)) {
        idx = source.indexOf(word); if (idx !== -1) break;
      }
    }
    if (idx !== -1) {
      const lineStart = source.lastIndexOf('\n', idx) + 1;
      const lineEnd = source.indexOf('\n', idx);
      this.textareaEl.focus();
      this.textareaEl.setSelectionRange(lineStart, lineEnd === -1 ? source.length : lineEnd);
      const linesBefore = source.substring(0, idx).split('\n').length;
      const lh = parseFloat(getComputedStyle(this.textareaEl).lineHeight) || 20;
      this.textareaEl.scrollTop = Math.max(0, (linesBefore - 3) * lh);
      if (this.highlightPreEl) this.highlightPreEl.scrollTop = this.textareaEl.scrollTop;
    }
  },

  applyFormat(actionName) {
    const action = FORMAT_ACTIONS[actionName];
    if (!action || !this.textareaEl) return;

    const ta = this.textareaEl;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end);
    const text = selected || action.placeholder || '';

    let result;
    let cursorStart;
    let cursorEnd;

    if (action.wrap) {
      const w = action.wrap;
      result = `${w}${text}${w}`;
      cursorStart = start + w.length;
      cursorEnd = cursorStart + text.length;
    } else if (action.prefix) {
      result = `${action.prefix}${text}`;
      cursorStart = start + action.prefix.length;
      cursorEnd = cursorStart + text.length;
    } else if (action.template) {
      result = action.template.replace('${text}', text);
      cursorStart = start;
      cursorEnd = start + result.length;
    } else if (action.block && action.replace) {
      let content = ta.value;
      content = content.replace(/^<!--\s*(layout|url)\s*:.*?-->\s*\n?/gm, '').replace(/^\n+/, '');
      ta.value = action.block + '\n' + content;
      this.setStatus('modified', 'Modifie');
      this.highlightSyntax();
      this.debouncedPreview();
      ta.setSelectionRange(0, action.block.length);
      ta.focus();
      return;
    } else if (action.block) {
      result = action.block.replace('${text}', text);
      const beforeStart = ta.value.substring(0, start);
      const needNl = beforeStart.length > 0 && !beforeStart.endsWith('\n');
      if (needNl) result = '\n' + result;
      cursorStart = start + (needNl ? 1 : 0);
      cursorEnd = cursorStart + result.length - (needNl ? 1 : 0);
    }

    if (result !== undefined) {
      ta.value = ta.value.substring(0, start) + result + ta.value.substring(end);
      ta.selectionStart = cursorStart;
      ta.selectionEnd = cursorEnd;
      ta.focus();
      this.setStatus('modified', 'Modifie');
      this.highlightSyntax();
      this.debouncedPreview();
    }
  },

  applyColorWrap(hex) {
    if (!this.textareaEl) return;
    const ta = this.textareaEl;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.substring(start, end) || 'texte';
    const result = `<span style="color:${hex}">${selected}</span>`;
    ta.value = ta.value.substring(0, start) + result + ta.value.substring(end);
    const innerStart = start + `<span style="color:${hex}">`.length;
    ta.selectionStart = innerStart;
    ta.selectionEnd = innerStart + selected.length;
    ta.focus();
    this.setStatus('modified', 'Modifie');
    this.highlightSyntax();
    this.debouncedPreview();
  },

  insertAtCursor(text) {
    const ta = this.textareaEl;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + text + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
    this.highlightSyntax();
    this.debouncedPreview();
  },

  /**
   * Upload une image et insere le markdown correspondant
   */
  async uploadImage(file) {
    if (!this.filePath || !file) return;

    if (!file.type.startsWith('image/')) {
      this.setStatus('modified', 'Seules les images sont acceptees');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.setStatus('modified', 'Image trop volumineuse (max 5 Mo)');
      return;
    }

    this.setStatus('', 'Upload en cours...');

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const apiBase = this.getApiBase();
      const response = await fetch(`${apiBase}/api/routes-editor/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: this.filePath,
          imageData: base64,
          filename: file.name
        })
      });

      const data = await response.json();
      if (data.success) {
        const name = file.name.replace(/\.[^.]+$/, '');
        this.insertAtCursor(`![${name}](${data.data.path})`);
        this.setStatus('saved', 'Image ajoutee');
      } else {
        this.setStatus('modified', data.error || 'Erreur upload');
      }
    } catch {
      this.setStatus('modified', 'Erreur reseau');
    }
  },

  toggle() {
    if (this.isActive) {
      this.deactivate();
    } else {
      this.activate();
    }
  },

  async activate() {
    this.isActive = true;
    document.body.classList.add('editor-active');

    const btn = document.getElementById('editorBtn');
    if (btn) btn.classList.add('active');

    // Charger le markdown complet depuis l'API (source de verite)
    await this.loadFullMarkdown();

    // Afficher le contenu de la slide courante
    this.loadSlideContent();
    this.setStatus('', 'Pret');

    // Focus sur le textarea
    if (this.textareaEl) {
      this.textareaEl.focus();
    }

    // Recalculer le scaling
    if (typeof computeAndApplyScale === 'function') {
      setTimeout(computeAndApplyScale, 50);
    }
  },

  deactivate() {
    this.isActive = false;
    document.body.classList.remove('editor-active');

    // Nettoyer le hover positioning
    if (typeof this.cleanupHoverPositioning === 'function') {
      this.cleanupHoverPositioning();
    }

    const btn = document.getElementById('editorBtn');
    if (btn) btn.classList.remove('active');

    // Recalculer le scaling
    if (typeof computeAndApplyScale === 'function') {
      setTimeout(computeAndApplyScale, 50);
    }
  },

  async loadFullMarkdown() {
    if (!this.filePath) return;

    try {
      const apiBase = this.getApiBase();
      const response = await fetch(`${apiBase}/api/routes-editor/load?file=${encodeURIComponent(this.filePath)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.originalFullMarkdown = data.data;
          return;
        }
      }
    } catch {
      // Fallback : reconstruire depuis SlideState
    }

    // Fallback : reconstruire depuis les slides en memoire
    this.originalFullMarkdown = this.reconstructMarkdown();
  },

  async duplicateSlide() {
    if (!SlideState.slides.length) return;
    const idx = SlideState.currentIndex;
    const s = SlideState.slides[idx];
    const clone = { rawContent: s.rawContent, notes: s.notes || '', layout: s.layout,
      cssClass: s.cssClass || null, cssStyle: s.cssStyle || null,
      iframeUrl: s.iframeUrl || null, positions: s.positions || null };
    SlideState.slides.splice(idx + 1, 0, clone);
    SlideState.totalSlides = SlideState.slides.length;
    const vp = document.getElementById('slideViewport');
    if (vp && typeof renderAllSlides === 'function') await renderAllSlides(SlideState.slides, vp);
    if (typeof goToSlide === 'function') goToSlide(idx + 1);
    this.setStatus('modified', 'Slide dupliquee');
  },

  loadSlideContent() {
    if (!this.textareaEl || !SlideState.slides.length) return;
    const slide = SlideState.slides[SlideState.currentIndex];
    if (slide) {
      // Separer le contenu et les notes
      const { content, notes } = extractNotes(slide.rawContent || '');
      this.textareaEl.value = content;
      if (this.notesTextareaEl) {
        this.notesTextareaEl.value = notes;
      }
      this.highlightSyntax();

      // Activer le hover positioning (toutes les slides quand l'editeur est actif)
      if (typeof this.initHoverPositioning === 'function') {
        this.initHoverPositioning();
      }
      this.updateBgSlider();
    }
  },

  syncNotesToRawContent() {
    if (!SlideState.slides.length) return;
    const currentIndex = SlideState.currentIndex;
    const mainContent = this.textareaEl ? this.textareaEl.value : '';
    const notesText = this.notesTextareaEl ? this.notesTextareaEl.value.trim() : '';

    SlideState.slides[currentIndex].rawContent = this.buildRawContent(mainContent, notesText);
    SlideState.slides[currentIndex].notes = notesText;
  },

  buildRawContent(mainContent, notesText) {
    if (!notesText) return mainContent;
    return mainContent.trimEnd() + '\n\n<!-- notes\n' + notesText + '\n-->';
  },

  async updatePreview() {
    if (!this.textareaEl || !SlideState.slides.length) return;

    const mainContent = this.textareaEl.value;
    const notesText = this.notesTextareaEl ? this.notesTextareaEl.value.trim() : '';
    const currentIndex = SlideState.currentIndex;

    // Reconstruire le rawContent complet (contenu + notes)
    const rawContent = this.buildRawContent(mainContent, notesText);
    SlideState.slides[currentIndex].rawContent = rawContent;

    // Extraire directives depuis le contenu principal (pas de notes dedans)
    const { content: contentWithoutDirectives, directives: dirs } = extractDirectives(mainContent);
    // Le contenu principal ne contient plus de notes, pas besoin d'extractNotes
    const cleanContent = contentWithoutDirectives;

    SlideState.slides[currentIndex].notes = notesText;
    SlideState.slides[currentIndex].layout = dirs.layout || detectLayout(cleanContent, currentIndex);
    SlideState.slides[currentIndex].cssClass = dirs.class || null;
    SlideState.slides[currentIndex].cssStyle = dirs.style || null;
    SlideState.slides[currentIndex].iframeUrl = dirs.url || null;
    SlideState.slides[currentIndex].positions = dirs.positions || null;

    // Re-rendre la slide
    const slideEl = document.querySelector(`.slide[data-index="${currentIndex}"]`);
    if (slideEl) {
      const html = renderMarkdown(cleanContent);
      slideEl.innerHTML = html;

      // Reset complet des styles inline et classes avant re-application
      const slide = SlideState.slides[currentIndex];
      slideEl.dataset.layout = slide.layout;
      slideEl.classList.remove('free-layout', 'has-bg-image');
      slideEl.style.cssText = '';
      if (slide.cssClass) slide.cssClass.split(/\s+/).forEach(c => slideEl.classList.add(c));
      if (slide.cssStyle) slideEl.style.cssText = slide.cssStyle;
      applyImageLayout(slideEl, slide.layout, slide.iframeUrl);
      if (typeof extractBgToVariable === 'function') extractBgToVariable(slideEl);

      // Positionnement per-element si directive positions
      if (slide.positions && typeof applyElementPositions === 'function') {
        applyElementPositions(slideEl, slide.positions);
      }

      // Post-traitement (KaTeX + Mermaid)
      await postProcessSlide(slideEl);

      // Re-attacher le hover positioning (toutes les slides)
      if (typeof this.initHoverPositioning === 'function') {
        this.initHoverPositioning();
      }
    }
  },

  async save() {
    if (!this.filePath || !this.saveBtn) return;
    const origText = this.saveBtn.textContent;
    this.saveBtn.disabled = true;
    this.saveBtn.classList.add('loading');
    this.setStatus('', 'Sauvegarde...');
    const fullMarkdown = this.reconstructMarkdown();
    let ok = false;
    try {
      const res = await fetch(`${this.getApiBase()}/api/routes-editor/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: this.filePath, fullMarkdown })
      });
      const data = await res.json();
      if (data.success) {
        this.originalFullMarkdown = fullMarkdown;
        this.setStatus('saved', 'Sauvegarde');
        ok = true;
        if (typeof broadcastSlideChange === 'function') broadcastSlideChange();
      } else this.setStatus('modified', `Erreur : ${data.error}`);
    } catch { this.setStatus('modified', 'Erreur reseau'); }
    this.saveBtn.classList.remove('loading');
    this.saveBtn.textContent = ok ? 'Sauvegarde' : 'Erreur';
    this.saveBtn.classList.add(ok ? 'success' : 'error');
    setTimeout(() => {
      this.saveBtn.classList.remove('success', 'error');
      this.saveBtn.textContent = origText;
      this.saveBtn.disabled = false;
    }, 2000);
  },

  reconstructMarkdown() {
    const parts = [];
    if (SlideState.meta && Object.keys(SlideState.meta).length > 0) {
      const m = SlideState.meta;
      parts.push('---');
      ['title','author','date','theme','accent','font','heading-style'].forEach(k => { if (m[k]) parts.push(`${k}: ${m[k]}`); });
      parts.push('---', '');
    }
    SlideState.slides.forEach((s, i) => { if (i > 0) parts.push('---', ''); parts.push(s.rawContent, ''); });
    return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  },

  /* Slider opacite du fond */
  commitBgOpacity(opacity) {
    const idx = SlideState.currentIndex;
    let css = SlideState.slides[idx].cssStyle || '';
    css = css.replace(/;?\s*--bg-opacity:\s*[\d.]+/g, '').trim();
    if (opacity < 1) css += (css ? '; ' : '') + `--bg-opacity: ${opacity}`;
    SlideState.slides[idx].cssStyle = css || null;
    let content = this.textareaEl.value;
    const reg = /^<!--\s*style\s*:.*?-->\s*\n?/m;
    if (css) {
      content = reg.test(content) ? content.replace(reg, `<!-- style: ${css} -->\n`) : `<!-- style: ${css} -->\n` + content;
    } else if (reg.test(content)) {
      content = content.replace(reg, '');
    }
    this.textareaEl.value = content;
    this.syncNotesToRawContent();
    this.highlightSyntax();
    this.setStatus('modified', 'Modifie');
  },

  updateBgSlider() {
    const slider = document.getElementById('bgOpacitySlider');
    if (!slider) return;
    const layer = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"] .slide-bg-layer`);
    const op = layer ? (parseFloat(layer.style.opacity) || 1) : 1;
    slider.value = Math.round(op * 100);
    const wrap = document.getElementById('bgOpacityWrap');
    if (wrap) wrap.classList.toggle('hidden', !layer);
  },

  /* --- Coloration syntaxique Markdown --- */

  highlightSyntax() {
    if (!this.highlightCodeEl || !this.textareaEl) return;
    this.highlightCodeEl.innerHTML = this.tokenizeMarkdown(this.textareaEl.value) + '\n';
  },

  /**
   * Tokenizer ligne par ligne avec gestion d'etat pour les blocs multi-lignes
   */
  tokenizeMarkdown(text) {
    const lines = text.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeLang = '';

    for (const line of lines) {
      // Blocs de code fences (``` ou ```lang)
      if (/^```/.test(line)) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = line.slice(3).trim();
          const cls = codeLang === 'mermaid' ? 'md-mermaid' : 'md-code-fence';
          result.push(`<span class="${cls}">${escHtml(line)}</span>`);
        } else {
          const cls = codeLang === 'mermaid' ? 'md-mermaid' : 'md-code-fence';
          result.push(`<span class="${cls}">${escHtml(line)}</span>`);
          inCodeBlock = false;
          codeLang = '';
        }
        continue;
      }

      if (inCodeBlock) {
        const cls = codeLang === 'mermaid' ? 'md-mermaid' : 'md-code';
        result.push(`<span class="${cls}">${escHtml(line)}</span>`);
        continue;
      }

      // Directives : <!-- layout|class|style|url|positions : ... -->
      if (/^<!--\s*(layout|class|style|url|positions)\s*:/.test(line)) {
        const cls = /url\s*:/.test(line) ? 'md-iframe' : 'md-directive';
        result.push(`<span class="${cls}">${escHtml(line)}</span>`);
        continue;
      }

      // Separateur de slides : ---
      if (/^---\s*$/.test(line)) {
        result.push(`<span class="md-separator">${escHtml(line)}</span>`);
        continue;
      }

      // Titres : # a ####
      if (/^#{1,4}\s/.test(line)) {
        result.push(`<span class="md-heading">${escHtml(line)}</span>`);
        continue;
      }

      // Citations : > texte
      if (/^>\s/.test(line)) {
        result.push(`<span class="md-quote">${this.highlightInline(line)}</span>`);
        continue;
      }

      // Listes : - item, * item, 1. item
      if (/^(\s*[-*]|\s*\d+\.)\s/.test(line)) {
        result.push(`<span class="md-list">${this.highlightInline(line)}</span>`);
        continue;
      }

      // Ligne normale : coloration inline
      result.push(this.highlightInline(line));
    }

    return result.join('\n');
  },

  /**
   * Coloration des elements inline : code, images, liens, gras, italique
   */
  highlightInline(line) {
    let s = escHtml(line);

    // HTML inline : <span style="color:..."> et <div style="text-align:...">
    s = s.replace(/(&lt;span style=&quot;color:[^&]*&quot;&gt;)/g,
      '<span class="md-html-color">$1</span>');
    s = s.replace(/(&lt;\/span&gt;)/g,
      '<span class="md-html-color">$1</span>');
    s = s.replace(/(&lt;div style=&quot;text-align:[^&]*&quot;&gt;)/g,
      '<span class="md-html-align">$1</span>');
    s = s.replace(/(&lt;\/div&gt;)/g,
      '<span class="md-html-align">$1</span>');

    // Code inline : `code`
    s = s.replace(/`([^`]+)`/g,
      '<span class="md-code">`$1`</span>');

    // Images : ![alt](url)
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<span class="md-image">![$1]($2)</span>');

    // Liens : [texte](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<span class="md-link-text">[$1]</span><span class="md-link-url">($2)</span>');

    // Gras : **texte**
    s = s.replace(/\*\*([^*]+)\*\*/g,
      '<span class="md-bold-mark">**</span><span class="md-bold">$1</span><span class="md-bold-mark">**</span>');

    // Italique : *texte* (mais pas **)
    s = s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,
      '<span class="md-italic-mark">*</span><span class="md-italic">$1</span><span class="md-italic-mark">*</span>');

    return s;
  },

  setStatus(state, text) {
    if (this.statusDotEl) {
      this.statusDotEl.className = 'slide-editor-status-dot';
      if (state) this.statusDotEl.classList.add(state);
    }
    if (this.statusTextEl) {
      this.statusTextEl.textContent = text;
    }
  },

  getApiBase() {
    return '';
  },

  onSlideChange() {
    if (!this.isActive) return;
    if (typeof this.cleanupHoverPositioning === 'function') {
      this.cleanupHoverPositioning();
    }
    this.loadSlideContent();
    this.setStatus('', 'Pret');
  }
};

/* Initialisation */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => SlideEditor.init(), 150);
});
