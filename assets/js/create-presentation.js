/**
 * create-presentation.js — Modal de creation de presentation avec templates
 *
 * Depend de : utils.js (formatDate)
 */

const TEMPLATE_ICONS = {
  file: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  layout: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  zap: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>',
  briefcase: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
  copy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};

const CreatePresentation = {
  dialogEl: null,
  formEl: null,
  gridEl: null,
  errorEl: null,
  submitBtn: null,
  previewBodyEl: null,
  previewTitleEl: null,
  previewCountEl: null,
  templates: [],
  presentations: [],
  selectedTemplate: 'blank',
  cloneSource: null,

  init() {
    this.dialogEl = document.getElementById('createModal');
    this.formEl = document.getElementById('createForm');
    this.gridEl = document.getElementById('templateGrid');
    this.errorEl = document.getElementById('createError');
    this.submitBtn = document.getElementById('createSubmitBtn');
    this.previewBodyEl = document.getElementById('previewBody');
    this.previewTitleEl = document.getElementById('previewTitle');
    this.previewCountEl = document.getElementById('previewSlideCount');

    if (!this.dialogEl) return;

    const openBtn = document.getElementById('createPresentationBtn');
    if (openBtn) openBtn.addEventListener('click', () => this.open());

    const closeBtn = document.getElementById('createCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.dialogEl.addEventListener('click', (e) => {
      if (e.target === this.dialogEl) this.close();
    });

    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Pre-remplir l'auteur depuis localStorage
    const authorInput = document.getElementById('createAuthor');
    const savedAuthor = localStorage.getItem('slides-default-author');
    if (authorInput && savedAuthor) authorInput.value = savedAuthor;
  },

  async open() {
    if (!this.dialogEl) return;

    // Charger templates + presentations au premier appel
    if (this.templates.length === 0) {
      await Promise.all([this.loadTemplates(), this.loadPresentations()]);
    }

    this.clearError();
    this.selectedTemplate = 'blank';
    this.cloneSource = null;
    this.renderTemplates();
    this.updatePreview();
    this.dialogEl.showModal();

    // Focus sur le champ titre
    const titleInput = document.getElementById('createTitle');
    if (titleInput) {
      titleInput.value = '';
      setTimeout(() => titleInput.focus(), 50);
    }
    // Vider description et tags
    const descEl = document.getElementById('createDescription');
    const tagsEl = document.getElementById('createTags');
    if (descEl) descEl.value = '';
    if (tagsEl) tagsEl.value = '';
  },

  close() {
    if (this.dialogEl) this.dialogEl.close();
  },

  async openWithCloneContent(markdown) {
    if (this.templates.length === 0) {
      await Promise.all([this.loadTemplates(), this.loadPresentations()]);
    }
    this.clearError();
    this.selectedTemplate = '__clone__';
    this.cloneSource = { content: markdown };
    this.renderTemplates();
    this.updatePreview();
    this.dialogEl.showModal();
    const titleInput = document.getElementById('createTitle');
    if (titleInput) setTimeout(() => titleInput.focus(), 50);
  },

  async loadTemplates() {
    try {
      const response = await fetch('config/templates.json');
      if (!response.ok) throw new Error('Impossible de charger les templates');
      const data = await response.json();
      this.templates = data.templates || [];
    } catch {
      this.templates = [{ id: 'blank', name: 'Vide', description: 'Slide vierge', icon: 'file', content: '# {{title}}' }];
    }
  },

  async loadPresentations() {
    try {
      const response = await fetch('config/presentations.json');
      if (!response.ok) throw new Error('Impossible de charger les presentations');
      const data = await response.json();
      this.presentations = data.presentations || [];
    } catch {
      this.presentations = [];
    }
  },

  renderTemplates() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';

    // Cartes de templates
    this.templates.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'create-template-card' + (tpl.id === this.selectedTemplate && !this.cloneSource ? ' selected' : '');
      card.dataset.templateId = tpl.id;

      const icon = document.createElement('div');
      icon.className = 'create-template-card-icon';
      icon.innerHTML = TEMPLATE_ICONS[tpl.icon] || TEMPLATE_ICONS.file;
      card.appendChild(icon);

      const name = document.createElement('div');
      name.className = 'create-template-card-name';
      name.textContent = tpl.name;
      card.appendChild(name);

      card.setAttribute('title', tpl.description);
      card.addEventListener('click', () => this.selectTemplate(tpl.id));
      this.gridEl.appendChild(card);
    });

    // Carte "Depuis une existante"
    if (this.presentations.length > 0) {
      const card = document.createElement('div');
      card.className = 'create-template-card' + (this.cloneSource ? ' selected' : '');
      card.dataset.templateId = 'existing';

      const icon = document.createElement('div');
      icon.className = 'create-template-card-icon';
      icon.innerHTML = TEMPLATE_ICONS.copy;
      card.appendChild(icon);

      const name = document.createElement('div');
      name.className = 'create-template-card-name';
      name.textContent = 'Existante';
      card.appendChild(name);

      card.setAttribute('title', 'Partir d\'une presentation existante');
      card.addEventListener('click', () => this.showExistingList());
      this.gridEl.appendChild(card);
    }
  },

  selectTemplate(templateId) {
    this.selectedTemplate = templateId;
    this.cloneSource = null;

    // Mettre a jour la selection visuelle
    if (this.gridEl) {
      this.gridEl.querySelectorAll('.create-template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.templateId === templateId);
      });
    }

    // Pre-remplir la description depuis le template
    const tpl = this.templates.find(t => t.id === templateId);
    const descEl = document.getElementById('createDescription');
    if (descEl && tpl) {
      descEl.value = tpl.description || '';
    }

    this.updatePreview();
  },

  showExistingList() {
    this.selectedTemplate = null;

    // Mettre a jour la selection visuelle
    if (this.gridEl) {
      this.gridEl.querySelectorAll('.create-template-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.templateId === 'existing');
      });
    }

    // Afficher la liste dans l'apercu
    if (!this.previewBodyEl) return;

    if (this.previewTitleEl) this.previewTitleEl.textContent = 'Choisir une presentation';
    if (this.previewCountEl) this.previewCountEl.textContent = `${this.presentations.length} disponible${this.presentations.length > 1 ? 's' : ''}`;

    this.previewBodyEl.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'create-existing-list';

    this.presentations.forEach(pres => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'create-existing-item';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'create-existing-item-title';
      titleSpan.textContent = pres.title;
      item.appendChild(titleSpan);

      if (pres.date) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'create-existing-item-date';
        dateSpan.textContent = pres.date;
        item.appendChild(dateSpan);
      }

      item.addEventListener('click', () => this.selectExisting(pres));
      list.appendChild(item);
    });

    this.previewBodyEl.appendChild(list);
  },

  async selectExisting(pres) {
    this.cloneSource = pres;

    // Pre-remplir les champs du formulaire
    const descEl = document.getElementById('createDescription');
    const tagsEl = document.getElementById('createTags');
    const authorEl = document.getElementById('createAuthor');

    if (descEl) descEl.value = pres.description || '';
    if (tagsEl) tagsEl.value = (pres.tags || []).join(', ');
    if (authorEl && pres.author && !authorEl.value) authorEl.value = pres.author;

    // Surligner l'item selectionne
    if (this.previewBodyEl) {
      this.previewBodyEl.querySelectorAll('.create-existing-item').forEach(item => {
        const itemTitle = item.querySelector('.create-existing-item-title');
        item.classList.toggle('selected', itemTitle && itemTitle.textContent === pres.title);
      });
    }

    // Charger le contenu du fichier source pour l'apercu
    try {
      const response = await fetch(`/api/routes-editor/load?file=${encodeURIComponent(pres.file)}`);
      const result = await response.json();
      if (result.success && result.data) {
        this.cloneSource.content = result.data;
        this.renderContentPreview(result.data, pres.title);
      }
    } catch {
      // Apercu non disponible
    }
  },

  updatePreview() {
    if (!this.previewBodyEl) return;

    const tpl = this.templates.find(t => t.id === this.selectedTemplate);
    if (!tpl || !tpl.content) {
      if (this.previewTitleEl) this.previewTitleEl.textContent = 'Apercu';
      if (this.previewCountEl) this.previewCountEl.textContent = '';
      this.previewBodyEl.innerHTML = '<div class="create-preview-empty">Selectionnez un template</div>';
      return;
    }

    this.renderContentPreview(tpl.content, tpl.name);
  },

  renderContentPreview(content, label) {
    if (!this.previewBodyEl) return;

    // Parser la structure : decouper par ---
    const slides = content.split(/\n---\n/).map(s => s.trim()).filter(s => s.length > 0);

    if (this.previewTitleEl) this.previewTitleEl.textContent = label || 'Apercu';
    if (this.previewCountEl) this.previewCountEl.textContent = `${slides.length} slide${slides.length > 1 ? 's' : ''}`;

    this.previewBodyEl.innerHTML = '';

    slides.forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = 'create-preview-slide';

      const num = document.createElement('span');
      num.className = 'create-preview-slide-num';
      num.textContent = i + 1;
      div.appendChild(num);

      // Extraire le titre de la slide
      const lines = slide.split('\n').filter(l => l.trim().length > 0);
      const titleLine = lines.find(l => /^#{1,3}\s/.test(l));
      const titleText = titleLine ? titleLine.replace(/^#{1,3}\s+/, '') : lines[0] || '';

      const title = document.createElement('span');
      title.className = 'create-preview-slide-title';
      // Remplacer les placeholders pour l'apercu
      title.textContent = titleText
        .replace(/\{\{title\}\}/g, 'Mon titre')
        .replace(/\{\{author\}\}/g, 'Auteur')
        .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0])
        .replace(/\*\*/g, '');
      div.appendChild(title);

      // Extrait du contenu (premiere ligne non-titre, non-directive)
      const contentLine = lines.find(l =>
        l !== titleLine &&
        !l.startsWith('#') &&
        !l.startsWith('<!--') &&
        !l.startsWith('```') &&
        !l.startsWith('**{{')
      );
      if (contentLine) {
        const content = document.createElement('div');
        content.className = 'create-preview-slide-content';
        content.textContent = contentLine
          .replace(/^[-*]\s+/, '')
          .replace(/\*\*/g, '')
          .replace(/\{\{[^}]+\}\}/g, '...');
        div.appendChild(content);
      }

      this.previewBodyEl.appendChild(div);
    });
  },

  clearError() {
    if (this.errorEl) this.errorEl.textContent = '';
  },

  showError(msg) {
    if (this.errorEl) this.errorEl.textContent = msg;
  },

  async handleSubmit() {
    this.clearError();

    const title = (document.getElementById('createTitle')?.value || '').trim();
    const author = (document.getElementById('createAuthor')?.value || '').trim();
    const description = (document.getElementById('createDescription')?.value || '').trim();
    const tagsRaw = (document.getElementById('createTags')?.value || '').trim();

    // Validation
    if (title.length < 3) {
      this.showError('Le titre doit contenir au moins 3 caracteres');
      return;
    }

    // Persister l'auteur
    if (author) localStorage.setItem('slides-default-author', author);

    // Parser les tags
    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    // Feedback loading
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Creation...';
    }

    try {
      const payload = { title, author, description, tags };

      if (this.cloneSource && this.cloneSource.content) {
        // Mode clone : envoyer le contenu source
        payload.templateId = '__clone__';
        payload.cloneContent = this.cloneSource.content;
      } else {
        payload.templateId = this.selectedTemplate || 'blank';
      }

      const response = await fetch('/api/routes-creator/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        this.showError(result.error || 'Erreur lors de la creation');
        return;
      }

      // Rediriger vers le viewer en mode edition
      window.location.href = `viewer.html?file=${encodeURIComponent(result.data.file)}&editor=1`;

    } catch {
      this.showError('Erreur reseau, veuillez reessayer');
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Creer';
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => CreatePresentation.init());
