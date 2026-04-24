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
SlideEditor._selectedSubBlock = null;
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
    block.addEventListener('dblclick', SlideEditor._onBlockDblClick);
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
    block.removeEventListener('dblclick', SlideEditor._onBlockDblClick);
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

  if (SlideEditor._selectedBlock !== block) {
    SlideEditor.selectBlock(block);
    return;
  }

  const slide = SlideState.slides[SlideState.currentIndex];
  if (slide && !slide.positions) {
    const slideEl = document.querySelector(`.slide[data-index="${SlideState.currentIndex}"]`);
    if (slideEl) { SlideEditor.computeInitialPositions(slideEl); return; }
  }

  // Si sous-blocs actifs : les clics sous-blocs sont geres par _onSubBlockMouseDown (stopPropagation)
  // Ici = clic sur zone vide du bloc → resize ou drag du bloc
  if (block._subBlockMode) {
    if (e.target.classList.contains('slide-pos-handle') && e.target.parentElement === block) {
      SlideEditor.startResize(e, block, e.target.dataset.corner);
    } else if (!e.target.classList.contains('slide-block-color-btn')) {
      SlideEditor.startDrag(e, block);
    }
    return;
  }

  // Poignee du bloc parent → resize
  if (e.target.classList.contains('slide-pos-handle')) {
    SlideEditor.startResize(e, block, e.target.dataset.corner);
    return;
  }
  if (e.target.closest('.slide-block-color-btn')) return;

  // Drag du bloc parent (comportement normal)
  SlideEditor.startDrag(e, block);
};

// Double-clic sur un bloc → entrer en mode sous-bloc sur l'element clique
SlideEditor._onBlockDblClick = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const block = e.currentTarget;
  if (block._subBlockMode) return;
  let child = e.target;
  while (child && child.parentElement !== block && child !== block) child = child.parentElement;
  if (child && child !== block && child.nodeType === 1 &&
      !child.classList.contains('slide-pos-handle') && !child.classList.contains('slide-block-color-btn')) {
    SlideEditor._enterSubBlockMode(block);
    SlideEditor._selectSubBlock(child);
  }
};

/* =============================================
   SELECTION / DESELECTION
   ============================================= */

SlideEditor.selectBlock = function(blockEl) {
  this.deselectBlock();
  this._selectedBlock = blockEl;
  blockEl.classList.add('selected');

  // Ajuster immediatement si le contenu deborde deja
  this.fitBlockContent(blockEl);

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

  // Bouton refresh image Pexels (affiché uniquement si le bloc contient une image)
  const imgEl = blockEl.querySelector('img');
  if (imgEl && typeof SlideEditor.refreshImageByAlt === 'function') {
    const imgRefreshBtn = document.createElement('button');
    imgRefreshBtn.className = 'slide-block-img-refresh';
    imgRefreshBtn.title = 'Nouvelle image Pexels';
    imgRefreshBtn.type = 'button';
    imgRefreshBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>';
    imgRefreshBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const alt = imgEl.alt || imgEl.src;
      SlideEditor.refreshImageByAlt(alt, blockEl);
    });
    blockEl.appendChild(imgRefreshBtn);
  }

  // Panneau d'inputs de position
  const posWrap = document.getElementById('posInputsWrap');
  if (posWrap) {
    posWrap.classList.remove('hidden');
    this.updatePosInputs(blockEl);
  }
};

SlideEditor.deselectBlock = function() {
  if (this._selectedBlock) {
    if (this._selectedBlock._subBlockMode) this._exitSubBlockMode(this._selectedBlock);
    this._selectedBlock.classList.remove('selected');
    this._selectedBlock.querySelectorAll('.slide-pos-handle, .slide-block-color-btn, .slide-block-img-refresh').forEach(h => h.remove());
    if (this._selectedBlock._colorMenu) {
      this._selectedBlock._colorMenu.remove();
      this._selectedBlock._colorMenu = null;
    }
    this._selectedBlock = null;
  }
  const posWrap = document.getElementById('posInputsWrap');
  if (posWrap) posWrap.classList.add('hidden');
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
   AUTO-FIT CONTENU DANS LE BLOC
   ============================================= */

/**
 * Reduit le font-size du bloc en em pour que son contenu tienne
 * dans la hauteur explicitement definie.
 * Sans effet si le bloc n'a pas de hauteur fixee.
 */
SlideEditor.fitBlockContent = function(block) {
  if (!block.style.height || block.style.height === 'auto') return;

  // Reinitialiser la taille de police pour mesurer le contenu a sa taille naturelle
  block.style.fontSize = '';

  const boxH = block.offsetHeight;
  const boxW = block.offsetWidth;
  if (boxH === 0 || boxW === 0) return;

  // overflow:hidden est requis pour que scrollHeight reflète le contenu qui deborde
  // (avec overflow:visible le navigateur ne track pas les scroll dimensions)
  const prevOverflow = block.style.overflow;
  block.style.overflow = 'hidden';
  const contentH = block.scrollHeight;
  const contentW = block.scrollWidth;
  block.style.overflow = prevOverflow;

  // Aucun depassement : laisser la police par defaut
  if (contentH <= boxH && contentW <= boxW) return;

  // Ratio de reduction a appliquer
  const ratio = Math.min(boxH / contentH, boxW / contentW);
  // Arrondi a 2 decimales, borne entre 0.3 et 1
  const em = Math.round(Math.max(0.3, Math.min(1, ratio)) * 100) / 100;
  block.style.fontSize = `${em}em`;
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
  // Sous-blocs : reference = dimensions du bloc parent
  const isSub = block.classList.contains('slide-sub-block');
  const refW = isSub ? (block.offsetParent?.offsetWidth || 1280) : 1280;
  const refH = isSub ? (block.offsetParent?.offsetHeight || 720) : 720;
  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = parseFloat(block.style.left) || 0;
  const startTop = parseFloat(block.style.top) || 0;

  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / scale / refW * 100;
    const dy = (ev.clientY - startY) / scale / refH * 100;
    block.style.left = `${Math.max(0, startLeft + dx)}%`;
    block.style.top = `${Math.max(0, startTop + dy)}%`;
    SlideEditor.updatePosInputs(block);
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    SlideEditor._isDragging = false;
    SlideEditor.commitPositions();
    SlideEditor.updatePosInputs(block);
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
  const isSub = block.classList.contains('slide-sub-block');
  const refW = isSub ? (block.offsetParent?.offsetWidth || 1280) : 1280;
  const refH = isSub ? (block.offsetParent?.offsetHeight || 720) : 720;
  const startX = e.clientX;
  const startY = e.clientY;

  // Lire les dimensions depuis le style inline si dispo, sinon mesurer le DOM réel.
  // Sans ça, un bloc sans hauteur explicite saute à 30% dès le premier mousemove.
  const blockRect = block.getBoundingClientRect();
  const startW = block.style.width
      ? parseFloat(block.style.width)
      : Math.round(blockRect.width / scale / refW * 1000) / 10;
  const startH = (block.style.height && block.style.height !== 'auto')
      ? parseFloat(block.style.height)
      : Math.round(blockRect.height / scale / refH * 1000) / 10;
  const startL = parseFloat(block.style.left) || 0;
  const startT = parseFloat(block.style.top) || 0;

  let fitRAF = null;

  const onMove = (ev) => {
    const dx = (ev.clientX - startX) / scale / refW * 100;
    const dy = (ev.clientY - startY) / scale / refH * 100;

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

    // Auto-fit live : ajuste le font-size a chaque frame
    if (fitRAF) cancelAnimationFrame(fitRAF);
    fitRAF = requestAnimationFrame(() => {
      SlideEditor.fitBlockContent(block);
      SlideEditor.updatePosInputs(block);
    });
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    if (fitRAF) cancelAnimationFrame(fitRAF);
    SlideEditor._isDragging = false;
    SlideEditor.fitBlockContent(block);
    SlideEditor.commitPositions();
    SlideEditor.updatePosInputs(block);
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
    const fs = block.style.fontSize;
    if (h && h !== 'auto') {
      const hVal = `${Math.round(parseFloat(h))}%`;
      entries.push(fs ? `${i}:${left},${top},${width},${hVal},${fs}` : `${i}:${left},${top},${width},${hVal}`);
    } else {
      entries.push(`${i}:${left},${top},${width}`);
    }
  });

  // Sous-positions (sous-blocs dans un bloc parent)
  slideEl.querySelectorAll('.slide-sub-block').forEach(sub => {
    const parent = sub.closest('.slide-pos-block');
    if (!parent) return;
    const pIdx = parseInt(parent.dataset.posIndex, 10);
    const cIdx = parseInt(sub.dataset.subPosIndex, 10);
    if (isNaN(pIdx) || isNaN(cIdx)) return;
    const sl = Math.round(parseFloat(sub.style.left) || 0) + '%';
    const st = Math.round(parseFloat(sub.style.top) || 0) + '%';
    const sw = Math.round(parseFloat(sub.style.width) || 50) + '%';
    const sh = sub.style.height;
    const sf = sub.style.fontSize;
    const key = `${pIdx}/${cIdx}`;
    if (sh && sh !== 'auto') {
      const hv = `${Math.round(parseFloat(sh))}%`;
      entries.push(sf ? `${key}:${sl},${st},${sw},${hv},${sf}` : `${key}:${sl},${st},${sw},${hv}`);
    } else { entries.push(`${key}:${sl},${st},${sw}`); }
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

/* Mettre a jour les inputs L/T/W/H depuis le style inline du bloc */
SlideEditor.updatePosInputs = function(blockEl) {
  const wrap = document.getElementById('posInputsWrap');
  if (!wrap || wrap.classList.contains('hidden')) return;
  const toVal = str => (str && str !== 'auto') ? Math.round(parseFloat(str) * 10) / 10 : '';
  const l = document.getElementById('posInputLeft');
  const t = document.getElementById('posInputTop');
  const w = document.getElementById('posInputWidth');
  const h = document.getElementById('posInputHeight');
  if (l) l.value = toVal(blockEl.style.left);
  if (t) t.value = toVal(blockEl.style.top);
  if (w) w.value = toVal(blockEl.style.width);
  if (h) h.value = toVal(blockEl.style.height);
};

/* =============================================
   MODE SOUS-BLOC — selection individuelle des enfants
   ============================================= */

SlideEditor._enterSubBlockMode = function(parentBlock) {
  if (parentBlock._subBlockMode) return;

  const filtered = Array.from(parentBlock.children).filter(c =>
    !c.classList.contains('slide-pos-handle') && !c.classList.contains('slide-block-color-btn')
  );
  if (!filtered.length) return;

  // Figer la hauteur du parent si pas encore explicite (evite l'effondrement)
  if (!parentBlock.style.height || parentBlock.style.height === 'auto') {
    parentBlock.style.height = `${parseFloat((parentBlock.offsetHeight / 720 * 100).toFixed(1))}%`;
  }

  const parentRect = parentBlock.getBoundingClientRect();
  const pW = parentRect.width;
  const pH = parentRect.height;

  // Snapshot des positions avant modification (scale se compense)
  const snapshots = filtered.map((c, i) => {
    const r = c.getBoundingClientRect();
    const mt = parseFloat(getComputedStyle(c).marginTop) || 0;
    const ml = parseFloat(getComputedStyle(c).marginLeft) || 0;
    const scale = SlideEditor.getViewportScale();
    return {
      el: c, i,
      l: +((r.left - parentRect.left - ml * scale) / pW * 100).toFixed(1),
      t: +((r.top  - parentRect.top  - mt * scale) / pH * 100).toFixed(1),
      w: +(r.width / pW * 100).toFixed(1),
      h: +(r.height / pH * 100).toFixed(1)
    };
  });

  snapshots.forEach(({ el, i, l, t, w, h }) => {
    el.classList.add('slide-sub-block');
    el.dataset.subPosIndex = String(i);
    el.style.position = 'absolute';
    el.style.left = `${l}%`;
    el.style.top = `${t}%`;
    el.style.width = `${w}%`;
    el.style.height = `${h}%`;
    el.addEventListener('mousedown', SlideEditor._onSubBlockMouseDown);
  });

  parentBlock._subBlockMode = true;
  SlideEditor.commitPositions();
};

SlideEditor._exitSubBlockMode = function(parentBlock) {
  if (!parentBlock) return;
  this._selectedSubBlock = null;
  parentBlock.querySelectorAll('.slide-sub-block').forEach(c => {
    c.classList.remove('slide-sub-block', 'selected-sub');
    c.querySelectorAll('.slide-pos-handle').forEach(h => h.remove());
    c.removeEventListener('mousedown', SlideEditor._onSubBlockMouseDown);
  });
  parentBlock._subBlockMode = false;
};

SlideEditor._onSubBlockMouseDown = function(e) {
  e.stopPropagation();
  const child = this;
  if (e.target.classList.contains('slide-pos-handle')) {
    SlideEditor.startResize(e, child, e.target.dataset.corner);
    return;
  }
  if (SlideEditor._selectedSubBlock !== child) {
    SlideEditor._selectSubBlock(child);
  } else {
    SlideEditor.startDrag(e, child);
  }
};

SlideEditor._selectSubBlock = function(childEl) {
  if (this._selectedSubBlock && this._selectedSubBlock !== childEl) {
    this._selectedSubBlock.classList.remove('selected-sub');
    this._selectedSubBlock.querySelectorAll('.slide-pos-handle').forEach(h => h.remove());
  }
  this._selectedSubBlock = childEl;
  childEl.classList.add('selected-sub');
  ['nw', 'ne', 'sw', 'se'].forEach(corner => {
    const handle = document.createElement('div');
    handle.className = `slide-pos-handle slide-pos-handle-${corner}`;
    handle.dataset.corner = corner;
    childEl.appendChild(handle);
  });
  this.updatePosInputs(childEl);
};
