/**
 * edit-presentation.js — Modal d'edition des metadonnees d'une presentation
 *
 * Reutilise les styles de create-modal.css
 * Appelle PUT /api/routes-creator/update, DELETE /api/routes-creator/delete
 */

const EditPresentation = {
  dialogEl: null,
  formEl: null,
  errorEl: null,
  submitBtn: null,
  currentId: null,
  currentFile: null,
  pendingThumbnail: null,
  tags: [],

  init() {
    this.dialogEl = document.getElementById('editModal');
    this.formEl = document.getElementById('editForm');
    this.errorEl = document.getElementById('editError');
    this.submitBtn = document.getElementById('editSubmitBtn');

    if (!this.dialogEl) return;

    const closeBtn = document.getElementById('editCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    this.dialogEl.addEventListener('click', (e) => {
      if (e.target === this.dialogEl) this.close();
    });

    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    this.bindThumbnail();
    this.bindTags();

    const deleteBtn = document.getElementById('editDeleteBtn');
    if (deleteBtn) deleteBtn.addEventListener('click', () => this.handleDelete());
  },

  /* --- Tags chips --- */

  bindTags() {
    const input = document.getElementById('editTags');
    if (!input) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const val = input.value.replace(',', '').trim();
        if (val && !this.tags.includes(val)) {
          this.tags.push(val);
          this.renderChips();
        }
        input.value = '';
      }
      // Backspace sur input vide retire le dernier tag
      if (e.key === 'Backspace' && !input.value && this.tags.length > 0) {
        this.tags.pop();
        this.renderChips();
      }
    });

    // Aussi ajouter au blur (si l'utilisateur quitte le champ sans Entree)
    input.addEventListener('blur', () => {
      const val = input.value.replace(',', '').trim();
      if (val && !this.tags.includes(val)) {
        this.tags.push(val);
        this.renderChips();
      }
      input.value = '';
    });
  },

  renderChips() {
    const container = document.getElementById('editTagsChips');
    if (!container) return;
    container.innerHTML = '';

    this.tags.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.className = 'edit-tag-chip';
      chip.textContent = tag;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edit-tag-chip-remove';
      btn.textContent = '\u00d7';
      btn.addEventListener('click', () => {
        this.tags.splice(i, 1);
        this.renderChips();
        document.getElementById('editTags')?.focus();
      });

      chip.appendChild(btn);
      container.appendChild(chip);
    });
  },

  /* --- Thumbnail --- */

  bindThumbnail() {
    const zone = document.getElementById('editThumbnailZone');
    const input = document.getElementById('editThumbnailInput');
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) this.handleThumbnailFile(input.files[0]);
      input.value = '';
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) this.handleThumbnailFile(file);
    });
  },

  handleThumbnailFile(file) {
    if (file.size > 5 * 1024 * 1024) {
      this.showError('Image trop volumineuse (max 5 Mo)');
      return;
    }

    const preview = document.getElementById('editThumbnailPreview');
    const placeholder = document.getElementById('editThumbnailPlaceholder');
    const reader = new FileReader();

    reader.onload = (e) => {
      if (preview) { preview.src = e.target.result; preview.classList.add('visible'); }
      if (placeholder) placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);
    this.pendingThumbnail = file;
  },

  showThumbnailPreview(thumbnailPath) {
    const preview = document.getElementById('editThumbnailPreview');
    const placeholder = document.getElementById('editThumbnailPlaceholder');

    if (thumbnailPath) {
      if (preview) { preview.src = thumbnailPath; preview.classList.add('visible'); }
      if (placeholder) placeholder.classList.add('hidden');
    } else {
      if (preview) { preview.src = ''; preview.classList.remove('visible'); }
      if (placeholder) placeholder.classList.remove('hidden');
    }
  },

  /* --- Ouverture / fermeture --- */

  open(pres) {
    if (!this.dialogEl || !pres) return;

    this.currentId = pres.id;
    this.currentFile = pres.file;
    this.pendingThumbnail = null;
    this.clearError();

    const titleEl = document.getElementById('editTitle');
    const authorEl = document.getElementById('editAuthor');
    const descEl = document.getElementById('editDescription');
    const tagsEl = document.getElementById('editTags');
    const dateEl = document.getElementById('editDate');

    if (titleEl) titleEl.value = pres.title || '';
    if (authorEl) authorEl.value = pres.author || '';
    if (descEl) descEl.value = pres.description || '';
    if (dateEl) dateEl.value = pres.date || '';

    // Tags : initialiser les chips
    this.tags = Array.isArray(pres.tags) ? [...pres.tags] : [];
    if (tagsEl) tagsEl.value = '';
    this.renderChips();

    this.showThumbnailPreview(pres.thumbnail);

    this.dialogEl.showModal();
    if (titleEl) setTimeout(() => titleEl.focus(), 50);
  },

  close() {
    if (this.dialogEl) this.dialogEl.close();
    this.currentId = null;
    this.currentFile = null;
    this.pendingThumbnail = null;
  },

  clearError() {
    if (this.errorEl) this.errorEl.textContent = '';
  },

  showError(msg) {
    if (this.errorEl) this.errorEl.textContent = msg;
  },

  /* --- Upload thumbnail --- */

  async uploadThumbnail() {
    if (!this.pendingThumbnail || !this.currentFile) return null;

    const file = this.pendingThumbnail;
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

    const response = await fetch('/api/routes-editor/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: this.currentFile,
        imageData: base64,
        filename: file.name
      })
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Erreur upload');
    return result.data.path;
  },

  /* --- Suppression --- */

  async handleDelete() {
    if (!this.currentId) return;

    const title = document.getElementById('editTitle')?.value || this.currentId;
    if (!confirm(`Supprimer la présentation « ${title} » ?\n\nCette action est irréversible.`)) return;

    this.clearError();
    const deleteBtn = document.getElementById('editDeleteBtn');
    if (deleteBtn) { deleteBtn.disabled = true; deleteBtn.textContent = 'Suppression...'; }

    try {
      const response = await fetch('/api/routes-creator/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: this.currentId })
      });

      const result = await response.json();
      if (!result.success) { this.showError(result.error || 'Erreur suppression'); return; }

      if (typeof AppState !== 'undefined') {
        AppState.presentations = AppState.presentations.filter(p => p.id !== this.currentId);
        renderPresentations();
      }

      this.close();
    } catch (err) {
      this.showError(err.message || 'Erreur réseau');
    } finally {
      if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = 'Supprimer'; }
    }
  },

  /* --- Enregistrement --- */

  async handleSubmit() {
    this.clearError();

    const title = (document.getElementById('editTitle')?.value || '').trim();
    const author = (document.getElementById('editAuthor')?.value || '').trim();
    const description = (document.getElementById('editDescription')?.value || '').trim();
    const date = (document.getElementById('editDate')?.value || '').trim();

    // Ajouter le contenu de l'input s'il reste du texte non valide
    const tagsInput = document.getElementById('editTags');
    const leftover = (tagsInput?.value || '').replace(',', '').trim();
    if (leftover && !this.tags.includes(leftover)) this.tags.push(leftover);
    if (tagsInput) tagsInput.value = '';

    const tags = [...this.tags];

    if (title.length < 3) {
      this.showError('Le titre doit contenir au moins 3 caractères');
      return;
    }

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Enregistrement...';
    }

    try {
      let thumbnail;
      if (this.pendingThumbnail) {
        thumbnail = await this.uploadThumbnail();
      }

      const payload = { id: this.currentId, title, author, description, tags, date };
      if (thumbnail) payload.thumbnail = thumbnail;

      const response = await fetch('/api/routes-creator/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        this.showError(result.error || 'Erreur lors de la mise à jour');
        return;
      }

      const updated = result.data;
      if (typeof AppState !== 'undefined') {
        const pres = AppState.presentations.find(p => p.id === this.currentId);
        if (pres) {
          pres.id = updated.id;
          pres.title = updated.title;
          pres.author = updated.author;
          pres.description = updated.description;
          pres.tags = updated.tags;
          pres.file = updated.file;
          if (updated.date) pres.date = updated.date;
          if (updated.thumbnail) pres.thumbnail = updated.thumbnail;
        }
        renderPresentations();
      }

      this.close();

    } catch (err) {
      this.showError(err.message || 'Erreur réseau, veuillez réessayer');
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Enregistrer';
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => EditPresentation.init());
