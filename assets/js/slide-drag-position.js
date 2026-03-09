/**
 * slide-drag-position.js — Positionnement per-element par hover + drag
 *
 * Quand l'editeur est actif, le survol d'un element de la slide affiche
 * un cadre de selection et des poignees de deplacement/resize.
 * Si la slide n'a pas encore de directive positions, elle est creee
 * automatiquement au premier drag.
 *
 * Directive : <!-- positions: 0:l,t,w[,h] | 1:l,t,w[,h] -->
 * Depend de : slide-editor.js (SlideEditor, SlideState), slide-renderer.js
 */

SlideEditor._selectedBlock = null;
SlideEditor._hoverTimeout = null;
SlideEditor._isDragging = false;

/* =============================================
   HOVER POSITIONING — INIT / CLEANUP
   ============================================= */

/**
 * Attache les listeners hover sur les enfants de la slide courante.
 * Fonctionne meme si la slide n'a pas encore de positions (mode preview).
 */
SlideEditor.initHoverPositioning = function() {
  this.cleanupHoverPositioning();

  if (!this.isActive) return;
  const slide = SlideState.slides[SlideState.currentIndex];
  if (!slide) return;

  const slideEl = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
  if (!slideEl) return;

  if (slide.positions) {
    // Slide avec positions : s'assurer qu'elles sont appliquees dans le DOM
    const hasBlocks = slideEl.querySelectorAll('.slide-pos-block').length > 0;
    if (!slideEl.classList.contains('free-layout') || !hasBlocks) {
      if (typeof applyElementPositions === 'function') {
        applyElementPositions(slideEl, slide.positions);
      }
    }
  } else {
    // Slide sans positions : marquer les enfants pour le hover (mode preview)
    const children = Array.from(slideEl.children)
      .filter(c => !c.classList.contains('slide-bg-layer') &&
                   !c.classList.contains('slide-cover-overlay') &&
                   !c.classList.contains('slide-pos-block'));
    children.forEach((child, i) => {
      child.classList.add('slide-pos-block');
      child.dataset.posIndex = i;
    });
  }

  const blocks = slideEl.querySelectorAll('.slide-pos-block');
  blocks.forEach(block => {
    block.addEventListener('mouseenter', SlideEditor._onBlockMouseEnter);
    block.addEventListener('mouseleave', SlideEditor._onBlockMouseLeave);
    block.addEventListener('mousedown', SlideEditor._onBlockMouseDown);
  });

  // Clic sur la slide (zone vide) deselectionne le bloc actif
  slideEl.addEventListener('mousedown', SlideEditor._onSlideEmptyClick);
};

/**
 * Detache les listeners et nettoie l'etat
 */
SlideEditor.cleanupHoverPositioning = function() {
  clearTimeout(this._hoverTimeout);
  this._hoverTimeout = null;
  this._isDragging = false;
  this.deselectBlock();

  const slideEl = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
  if (!slideEl) return;

  const blocks = slideEl.querySelectorAll('.slide-pos-block');
  blocks.forEach(block => {
    block.removeEventListener('mouseenter', SlideEditor._onBlockMouseEnter);
    block.removeEventListener('mouseleave', SlideEditor._onBlockMouseLeave);
    block.removeEventListener('mousedown', SlideEditor._onBlockMouseDown);
  });

  slideEl.removeEventListener('mousedown', SlideEditor._onSlideEmptyClick);
};

/* =============================================
   HANDLERS HOVER
   ============================================= */

SlideEditor._onBlockMouseEnter = function(e) {
  clearTimeout(SlideEditor._hoverTimeout);
  SlideEditor._hoverTimeout = null;
  const block = e.currentTarget;
  if (SlideEditor._selectedBlock !== block) {
    SlideEditor.selectBlock(block);
  }
};

SlideEditor._onBlockMouseLeave = function() {
  if (SlideEditor._isDragging) return;
  // Ne pas deselectionner au mouse leave — le cadre reste visible
  // jusqu'a ce que l'utilisateur clique ailleurs ou selectionne un autre bloc
};

SlideEditor._onSlideEmptyClick = function(e) {
  // Deselectionner uniquement si on clique sur la slide elle-meme (zone vide)
  if (!e.target.closest('.slide-pos-block')) {
    const slide = SlideState.slides[SlideState.currentIndex];
    if (slide && slide.positions) {
      SlideEditor.commitPositions();
    }
    SlideEditor.deselectBlock();
  }
};

SlideEditor._onBlockMouseDown = function(e) {
  e.stopPropagation();
  const block = e.currentTarget;

  // S'assurer que le bloc est selectionne
  if (SlideEditor._selectedBlock !== block) {
    SlideEditor.selectBlock(block);
  }

  // Selectionner le texte correspondant dans le textarea
  const blockText = block.textContent.trim();
  if (blockText && typeof SlideEditor.focusTextInEditor === 'function') {
    SlideEditor.focusTextInEditor(blockText);
  }

  // Auto-initialiser les positions si la slide n'en a pas encore
  const slide = SlideState.slides[SlideState.currentIndex];
  if (slide && !slide.positions) {
    const slideEl = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
    if (slideEl) {
      SlideEditor.computeInitialPositions(slideEl);
      return;
    }
  }

  // Poignee = resize, sinon = drag
  if (e.target.classList.contains('slide-pos-handle')) {
    SlideEditor.startResize(e, block, e.target.dataset.corner);
  } else {
    SlideEditor.startDrag(e, block);
  }
};

/* =============================================
   SELECTION / DESELECTION
   ============================================= */

SlideEditor.selectBlock = function(blockEl) {
  this.deselectBlock();
  this._selectedBlock = blockEl;
  blockEl.classList.add('selected');

  ['nw', 'ne', 'sw', 'se'].forEach(corner => {
    const handle = document.createElement('div');
    handle.className = `slide-pos-handle slide-pos-handle-${corner}`;
    handle.dataset.corner = corner;
    blockEl.appendChild(handle);
  });

  // Bouton couleur flottant a gauche du bloc
  const colorBtn = document.createElement('button');
  colorBtn.className = 'slide-block-color-btn';
  colorBtn.title = 'Couleur du texte';
  colorBtn.type = 'button';
  colorBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 20L12 4l6 16"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="4" y1="22" x2="20" y2="22" stroke-width="3"/></svg>';
  colorBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    SlideEditor._toggleBlockColorMenu(blockEl, colorBtn);
  });
  blockEl.appendChild(colorBtn);
};

SlideEditor.deselectBlock = function() {
  if (this._selectedBlock) {
    this._selectedBlock.classList.remove('selected');
    this._selectedBlock.querySelectorAll('.slide-pos-handle, .slide-block-color-btn').forEach(h => h.remove());
    if (this._selectedBlock._colorMenu) {
      this._selectedBlock._colorMenu.remove();
      this._selectedBlock._colorMenu = null;
    }
    this._selectedBlock = null;
  }
};

/**
 * Affiche/masque le menu couleur local colle au bouton du bloc
 */
/**
 * Applique une couleur au bloc : visuellement + dans le textarea markdown
 */
/**
 * @param {boolean} skipPreview — si true, ne pas re-rendre la slide (pour le live picking)
 */
SlideEditor._applyBlockColor = function(blockEl, color, skipPreview) {
  // Visuel immediat sur le DOM (bloc + enfants avec couleur inline)
  blockEl.style.color = color;
  blockEl.querySelectorAll('[style*="color"]').forEach(el => {
    el.style.color = color;
  });

  if (!this.textareaEl) return;
  const ta = this.textareaEl;
  const blockText = blockEl.textContent.trim();
  if (!blockText) return;

  // Trouver la ligne du textarea qui contient le texte du bloc
  const lines = ta.value.split('\n');
  let lineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i]
      .replace(/<span\s+style="color:#[0-9a-fA-F]{3,6}">/g, '')
      .replace(/<\/span>/g, '')
      .replace(/^#{1,6}\s+/, '').replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/^>\s+/, '')
      .trim();
    if (stripped && (blockText.includes(stripped) || stripped.includes(blockText))) {
      lineIdx = i;
      break;
    }
  }
  if (lineIdx === -1) return;

  const line = lines[lineIdx];

  let prefix = '';
  const mdMatch = line.match(/^(#{1,6}\s+|[-*]\s+|\d+\.\s+|>\s+)/);
  if (mdMatch) prefix = mdMatch[0];

  let content = line.substring(prefix.length);
  let prev;
  do {
    prev = content;
    content = content.replace(/<span\s+style="color:#[0-9a-fA-F]{3,6}">([\s\S]*?)<\/span>/g, '$1');
  } while (content !== prev);

  lines[lineIdx] = `${prefix}<span style="color:${color}">${content}</span>`;
  ta.value = lines.join('\n');

  this.setStatus('modified', 'Modifie');
  this.highlightSyntax();
  if (!skipPreview) this.debouncedPreview();
};

SlideEditor._toggleBlockColorMenu = function(blockEl, anchorBtn) {
  if (blockEl._colorMenu) {
    blockEl._colorMenu.remove();
    blockEl._colorMenu = null;
    return;
  }

  const self = this;
  const menu = document.createElement('div');
  menu.className = 'slide-block-color-menu';

  // Empecher les clics dans le menu de remonter (evite deselection ou re-render)
  menu.addEventListener('mousedown', (e) => e.stopPropagation());
  menu.addEventListener('click', (e) => e.stopPropagation());

  // Grille de couleurs presets
  const grid = document.createElement('div');
  grid.className = 'fmt-color-grid';
  const colors = [
    { hex: '#ef4444', name: 'Rouge' }, { hex: '#f97316', name: 'Orange' },
    { hex: '#eab308', name: 'Jaune' }, { hex: '#22c55e', name: 'Vert' },
    { hex: '#3b82f6', name: 'Bleu' },  { hex: '#8b5cf6', name: 'Violet' },
    { hex: '#ec4899', name: 'Rose' },   { hex: '#ffffff', name: 'Blanc' }
  ];
  colors.forEach(c => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = c.name;
    const dot = document.createElement('span');
    dot.className = 'fmt-color-dot' + (c.hex === '#ffffff' ? ' fmt-color-dot-white' : '');
    dot.style.background = c.hex;
    btn.appendChild(dot);
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      self._applyBlockColor(blockEl, c.hex);
      menu.remove();
    });
    grid.appendChild(btn);
  });
  menu.appendChild(grid);

  // Ligne custom : picker natif + hex + OK
  const custom = document.createElement('div');
  custom.className = 'fmt-color-custom';
  const native = document.createElement('input');
  native.type = 'color';
  native.value = '#ef4444';
  native.title = 'Choisir visuellement';
  const hexInput = document.createElement('input');
  hexInput.type = 'text';
  hexInput.value = '#ef4444';
  hexInput.placeholder = '#FF0000';
  hexInput.maxLength = 7;
  hexInput.spellcheck = false;
  const ok = document.createElement('button');
  ok.type = 'button';
  ok.textContent = 'OK';

  native.addEventListener('input', (e) => {
    e.stopPropagation();
    hexInput.value = native.value.toUpperCase();
    self._applyBlockColor(blockEl, native.value, true);
  });
  hexInput.addEventListener('input', (e) => {
    e.stopPropagation();
    if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
      native.value = hexInput.value;
      self._applyBlockColor(blockEl, hexInput.value, true);
    }
  });
  hexInput.addEventListener('mousedown', (e) => e.stopPropagation());
  ok.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const v = hexInput.value;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      self._applyBlockColor(blockEl, v);
    }
    menu.remove();
  });

  custom.appendChild(native);
  custom.appendChild(hexInput);
  custom.appendChild(ok);
  menu.appendChild(custom);

  // Positionner en fixed par rapport au bouton couleur pour passer au-dessus du panneau editeur
  const btnRect = anchorBtn.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.left = `${btnRect.left - 190}px`;
  menu.style.top = `${btnRect.top}px`;
  document.body.appendChild(menu);

  // Stocker la reference pour cleanup a la deselection
  blockEl._colorMenu = menu;
};

/* =============================================
   VIEWPORT SCALE
   ============================================= */

SlideEditor.getViewportScale = function() {
  const viewport = document.getElementById('slideViewport');
  if (!viewport) return 1;
  return viewport.getBoundingClientRect().width / 1280;
};

/* =============================================
   INITIALISATION DES POSITIONS (bouton toolbar ou auto)
   ============================================= */

SlideEditor.computeInitialPositions = function(slideEl) {
  if (!this.textareaEl) return;

  const children = Array.from(slideEl.children)
    .filter(c => !c.classList.contains('slide-bg-layer'));
  if (children.length === 0) return;

  const slideW = slideEl.offsetWidth || 1280;
  const slideH = slideEl.offsetHeight || 720;

  const entries = children.map((child, i) => {
    const left = Math.round(child.offsetLeft / slideW * 100);
    const top = Math.round(child.offsetTop / slideH * 100);
    const width = Math.round(child.offsetWidth / slideW * 100);
    return `${i}:${left}%,${top}%,${width}%`;
  });

  const posValue = entries.join(' | ');

  let content = this.textareaEl.value;
  content = `<!-- positions: ${posValue} -->\n` + content;

  this.textareaEl.value = content;
  this.setStatus('modified', 'Modifie');
  this.highlightSyntax();

  SlideState.slides[SlideState.currentIndex].positions = posValue;
  this.debouncedPreview();

  // Apres le re-render, activer le hover positioning
  setTimeout(() => this.initHoverPositioning(), 400);
};

/* =============================================
   DRAG
   ============================================= */

SlideEditor.startDrag = function(e, block) {
  e.preventDefault();
  this._isDragging = true;
  clearTimeout(this._hoverTimeout);

  const scale = this.getViewportScale();
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = parseFloat(block.style.left) || 0;
  const startTop = parseFloat(block.style.top) || 0;

  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / scale / 1280 * 100;
    const dy = (ev.clientY - startY) / scale / 720 * 100;
    block.style.left = `${Math.max(0, startLeft + dx)}%`;
    block.style.top = `${Math.max(0, startTop + dy)}%`;
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    SlideEditor._isDragging = false;
    SlideEditor.commitPositions();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

/* =============================================
   RESIZE
   ============================================= */

SlideEditor.startResize = function(e, block, corner) {
  e.preventDefault();
  e.stopPropagation();
  this._isDragging = true;
  clearTimeout(this._hoverTimeout);

  const scale = this.getViewportScale();
  const startX = e.clientX;
  const startY = e.clientY;
  const startW = parseFloat(block.style.width) || 50;
  const startH = parseFloat(block.style.height) || 30;
  const startL = parseFloat(block.style.left) || 0;
  const startT = parseFloat(block.style.top) || 0;

  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / scale / 1280 * 100;
    const dy = (ev.clientY - startY) / scale / 720 * 100;

    if (corner.includes('e')) block.style.width = `${Math.max(5, startW + dx)}%`;
    if (corner.includes('w')) {
      block.style.width = `${Math.max(5, startW - dx)}%`;
      block.style.left = `${startL + dx}%`;
    }
    if (corner.includes('s')) block.style.height = `${Math.max(5, startH + dy)}%`;
    if (corner.includes('n')) {
      block.style.height = `${Math.max(5, startH - dy)}%`;
      block.style.top = `${startT + dy}%`;
    }
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    SlideEditor._isDragging = false;
    SlideEditor.commitPositions();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

/* =============================================
   COMMIT — ecrit les positions dans le textarea
   ============================================= */

SlideEditor.commitPositions = function() {
  if (!this.textareaEl) return;

  const slideEl = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
  if (!slideEl) return;

  const blocks = slideEl.querySelectorAll('.slide-pos-block');
  const entries = [];

  blocks.forEach(block => {
    const i = parseInt(block.dataset.posIndex, 10);
    if (isNaN(i)) return;

    const left = Math.round(parseFloat(block.style.left) || 0) + '%';
    const top = Math.round(parseFloat(block.style.top) || 0) + '%';
    const width = Math.round(parseFloat(block.style.width) || 50) + '%';
    const h = block.style.height;
    if (h && h !== 'auto') {
      entries.push(`${i}:${left},${top},${width},${Math.round(parseFloat(h))}%`);
    } else {
      entries.push(`${i}:${left},${top},${width}`);
    }
  });

  const posValue = entries.join(' | ');

  let content = this.textareaEl.value;
  const posRegex = /^<!--\s*positions\s*:.*?-->\s*\n?/m;

  if (posRegex.test(content)) {
    content = content.replace(posRegex, `<!-- positions: ${posValue} -->\n`);
  } else {
    content = `<!-- positions: ${posValue} -->\n` + content;
  }

  this.textareaEl.value = content;
  SlideState.slides[SlideState.currentIndex].positions = posValue;

  // Synchroniser rawContent pour que la sauvegarde inclue les positions
  const notesText = this.notesTextareaEl ? this.notesTextareaEl.value.trim() : '';
  SlideState.slides[SlideState.currentIndex].rawContent = this.buildRawContent(content, notesText);

  this.setStatus('modified', 'Modifie');
  this.highlightSyntax();
};
