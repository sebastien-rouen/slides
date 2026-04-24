/**
 * slide-engine.js — Moteur de navigation des slides
 *
 * Gère : état, navigation (clavier, boutons, touch, hash),
 * scaling 16:9, plein écran, BroadcastChannel.
 *
 * Dépend de : slide-parser.js, slide-renderer.js, utils.js
 */

/* =============================================
   ÉTAT
   ============================================= */

const SlideState = {
  slides: [],
  meta: {},
  currentIndex: 0,
  totalSlides: 0,
  isFullscreen: false,
  touchStartX: 0,
  touchStartY: 0,
  broadcastChannel: null,
  presSlug: ''   // ex: "2026-04-26-formats-de-retrospectives"
};

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

/* =============================================
   INITIALISATION
   ============================================= */

/**
 * Format d'URL : viewer.html#{date}-{id}:{slide-slug}
 *   ex: viewer.html#2026-04-26-formats-de-retrospectives:introduction
 * Fallback : viewer.html?file=pages/slug/main.md  (rétrocompat)
 */

function _hashPresPart() {
  return decodeURIComponent(window.location.hash.replace(/^#/, '')).split(':')[0] || '';
}

function _hashSlidePart() {
  return decodeURIComponent(window.location.hash.replace(/^#/, '')).split(':')[1] || '';
}

function resolveFileFromUrl() {
  const presPart = _hashPresPart();
  if (presPart) {
    const id = presPart.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (id) { SlideState.presSlug = presPart; return `pages/${id}/main.md`; }
  }
  const param = getUrlParam('file');
  if (param) {
    const m = param.match(/pages\/([^/]+)\/main\.md/);
    SlideState.presSlug = m ? m[1] : '';
    return param;
  }
  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const file = resolveFileFromUrl();
  if (!file) {
    showLoadError('Aucune présentation spécifiée.');
    return;
  }

  try {
    // 1. Charger le Markdown
    const markdown = await fetchPresentation(file);

    // 2. Parser
    const { meta, slides } = parsePresentation(markdown);
    SlideState.meta = meta;
    SlideState.slides = slides;
    SlideState.totalSlides = slides.length;

    // 3. Slugs pour les URLs lisibles
    computeSlideSlugs(slides);

    // 4. Titre
    updatePageTitle(meta.title || file);

    // 5. Index depuis le hash
    const hashIndex = parseHashIndex();
    SlideState.currentIndex = Math.max(0, Math.min(hashIndex, slides.length - 1));

    // 6. Rendre les slides
    const viewport = document.getElementById('slideViewport');
    await renderAllSlides(slides, viewport);

    // 7. Afficher la slide courante
    showSlide(SlideState.currentIndex);

    // 8. Scaling
    computeAndApplyScale();

    // 9. Event listeners
    bindKeyboard();
    bindNavigationButtons();
    bindTouch();
    bindWheel();
    bindResize();
    bindZoomSelect();

    // 10. BroadcastChannel
    initBroadcastChannel();

    // 11. Signaler que les slides sont pretes (pour ThemeManager, etc.)
    window.dispatchEvent(new CustomEvent('slidesReady'));

  } catch (error) {
    showLoadError(`Impossible de charger la présentation : ${file}`);
  }
});

/* =============================================
   CHARGEMENT
   ============================================= */

async function fetchPresentation(file) {
  const response = await fetch(file);
  if (!response.ok) throw new Error(`HTTP ${response.status} pour ${file}`);
  return response.text();
}

/* =============================================
   NAVIGATION
   ============================================= */

function goToSlide(index) {
  if (index < 0 || index >= SlideState.totalSlides) return;

  const prev = SlideState.currentIndex;
  SlideState.currentIndex = index;

  const slides = document.querySelectorAll('.slide');

  if (slides[prev] && prev !== index) {
    slides[prev].classList.remove('active');
  }

  if (slides[index]) slides[index].classList.add('active');

  updateProgressBar();
  updateCounter();
  updateHash();
  updateNavButtons();
  broadcastSlideChange();

  // Notifier l'éditeur du changement de slide
  if (typeof SlideEditor !== 'undefined') SlideEditor.onSlideChange();
}

function nextSlide() { goToSlide(SlideState.currentIndex + 1); }
function prevSlide() { goToSlide(SlideState.currentIndex - 1); }
function firstSlide() { goToSlide(0); }
function lastSlide() { goToSlide(SlideState.totalSlides - 1); }
function showSlide(index) { goToSlide(index); }

/* =============================================
   UI
   ============================================= */

function updateProgressBar() {
  const pct = SlideState.totalSlides > 1
    ? (SlideState.currentIndex / (SlideState.totalSlides - 1)) * 100
    : 100;
  const bar = document.getElementById('slideProgress');
  if (bar) {
    bar.style.width = `${pct}%`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
  }
}

function updateCounter() {
  const counter = document.getElementById('slideCounter');
  if (counter) {
    counter.textContent = `${SlideState.currentIndex + 1} / ${SlideState.totalSlides}`;
  }
}

function updateNavButtons() {
  const atStart = SlideState.currentIndex === 0;
  const atEnd = SlideState.currentIndex === SlideState.totalSlides - 1;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const firstBtn = document.getElementById('firstSlideBtn');
  const lastBtn = document.getElementById('lastSlideBtn');

  if (prevBtn) prevBtn.disabled = atStart;
  if (firstBtn) firstBtn.disabled = atStart;
  if (nextBtn) nextBtn.disabled = atEnd;
  if (lastBtn) lastBtn.disabled = atEnd;
}

function updatePageTitle(title) {
  document.title = `${title} — Slides`;
  const viewerTitle = document.getElementById('viewerTitle');
  if (viewerTitle) viewerTitle.textContent = title;
}

/* =============================================
   SCALING 16:9
   ============================================= */

/** Zoom force : null = auto, sinon valeur numerique (1 = 100%) */
let _forcedZoom = null;

function setForcedZoom(value) {
  _forcedZoom = value;
  computeAndApplyScale();
}

function computeAndApplyScale() {
  const stage = document.getElementById('slideStage');
  const viewport = document.getElementById('slideViewport');
  if (!stage || !viewport) return;

  let scale;
  if (_forcedZoom !== null) {
    scale = _forcedZoom;
  } else {
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    scale = computeSlideScale(stageW, stageH, SLIDE_WIDTH, SLIDE_HEIGHT);
  }

  viewport.style.transform = `scale(${scale})`;
  viewport.style.width = `${SLIDE_WIDTH}px`;
  viewport.style.height = `${SLIDE_HEIGHT}px`;
}

function bindResize() {
  window.addEventListener('resize', throttle(computeAndApplyScale, 100));
  if (typeof ResizeObserver !== 'undefined') {
    const stage = document.getElementById('slideStage');
    if (stage) {
      new ResizeObserver(computeAndApplyScale).observe(stage);
    }
  }
}

function bindZoomSelect() {
  const sel = document.getElementById('zoomSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    const val = sel.value;
    setForcedZoom(val === 'auto' ? null : parseFloat(val));
  });
}

/* =============================================
   CLAVIER
   ============================================= */

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'Home':
        e.preventDefault();
        firstSlide();
        break;
      case 'End':
        e.preventDefault();
        lastSlide();
        break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) toggleFullscreen();
        break;
      case 'p':
      case 'P':
        if (!e.ctrlKey && !e.metaKey) openPresenterView();
        break;
      case 's':
      case 'S':
        if (!e.ctrlKey && !e.metaKey && typeof ThemeManager !== 'undefined') {
          ThemeManager.togglePanel();
        }
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey && typeof SlideEditor !== 'undefined') {
          SlideEditor.toggle();
        }
        break;
      case 'Escape':
        if (SlideState.isFullscreen) exitFullscreen();
        else if (typeof SlideEditor !== 'undefined' && SlideEditor.isActive) SlideEditor.deactivate();
        else if (typeof ThemeManager !== 'undefined') ThemeManager.closePanel();
        break;
    }
  });
}

/* =============================================
   TOUCH / SWIPE
   ============================================= */

function bindTouch() {
  const stage = document.getElementById('slideStage');
  if (!stage) return;

  stage.addEventListener('touchstart', (e) => {
    SlideState.touchStartX = e.changedTouches[0].clientX;
    SlideState.touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - SlideState.touchStartX;
    const dy = e.changedTouches[0].clientY - SlideState.touchStartY;
    const threshold = 50;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });
}

/* =============================================
   SCROLL MOLETTE → slide suivante / précédente
   ============================================= */

function bindWheel() {
  const stage = document.getElementById('slideStage');
  if (!stage) return;

  let cooldown = false;

  stage.addEventListener('wheel', (e) => {
    // Laisser le scroll normal dans le panneau éditeur et les textareas
    if (e.target.closest('#slideEditorPanel, textarea, select, input')) return;
    // Laisser le scroll vertical dans les slides qui débordent (overflow scroll)
    const slideEl = e.target.closest('.slide');
    if (slideEl && slideEl.scrollHeight > slideEl.clientHeight && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      if ((e.deltaY > 0 && slideEl.scrollTop < slideEl.scrollHeight - slideEl.clientHeight) ||
          (e.deltaY < 0 && slideEl.scrollTop > 0)) return;
    }

    e.preventDefault();

    if (cooldown) return;
    cooldown = true;
    setTimeout(() => { cooldown = false; }, 600);

    if (e.deltaY > 0 || e.deltaX > 0) nextSlide();
    else prevSlide();
  }, { passive: false });
}

/* =============================================
   BOUTONS DE NAVIGATION
   ============================================= */

function bindNavigationButtons() {
  document.getElementById('prevBtn')?.addEventListener('click', prevSlide);
  document.getElementById('nextBtn')?.addEventListener('click', nextSlide);
  document.getElementById('firstSlideBtn')?.addEventListener('click', firstSlide);
  document.getElementById('lastSlideBtn')?.addEventListener('click', lastSlide);
  document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);
  document.getElementById('presenterBtn')?.addEventListener('click', openPresenterView);
  document.getElementById('shareBtn')?.addEventListener('click', copySlideLink);
  document.getElementById('printBtn')?.addEventListener('click', () => {
    if (typeof preparePrint === 'function') preparePrint();
  });
}

/* =============================================
   HASH / DEEP LINKING
   ============================================= */

/** Extrait le titre principal d'un bloc markdown de slide */
function _titleFromSlideContent(raw) {
  const lines = raw.replace(/<!--[\s\S]*?-->/g, '').split('\n');
  for (const line of lines) {
    const m = line.match(/^#{1,6}\s+(.+)/);
    if (m) {
      return m[1]
        .replace(/\*\*?([^*]+)\*\*?/g, '$1') // gras/italique
        .replace(/`([^`]+)`/g, '$1')           // code inline
        .trim();
    }
  }
  return '';
}

/** Slugifie un texte en kebab-case ASCII */
function _slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60) || 'slide';
}

/** Génère des slugs uniques pour toutes les slides et les stocke dans slide.slug */
function computeSlideSlugs(slides) {
  const seen = new Map();
  slides.forEach(slide => {
    const base = _slugify(_titleFromSlideContent(slide.rawContent || ''));
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    slide.slug = count === 0 ? base : `${base}-${count + 1}`;
  });
}

function parseHashIndex() {
  const part = _hashSlidePart();
  if (!part) return 0;
  if (/^\d+$/.test(part)) return parseInt(part, 10) - 1;
  const idx = SlideState.slides.findIndex(s => s.slug === part);
  return idx >= 0 ? idx : 0;
}

function updateHash() {
  const slide = SlideState.slides[SlideState.currentIndex];
  const slidePart = slide?.slug || String(SlideState.currentIndex + 1);
  const newHash = SlideState.presSlug
    ? `#${SlideState.presSlug}:${slidePart}`
    : `#${slidePart}`;
  history.replaceState(null, '', newHash);
}

window.addEventListener('hashchange', () => {
  // Si la partie présentation change → recharger (autre présentation)
  const newPres = _hashPresPart();
  if (SlideState.presSlug && newPres && newPres !== SlideState.presSlug) {
    window.location.reload();
    return;
  }
  const index = parseHashIndex();
  if (index !== SlideState.currentIndex) goToSlide(index);
});

/* =============================================
   PLEIN ÉCRAN
   ============================================= */

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
    SlideState.isFullscreen = true;
  } else {
    document.exitFullscreen?.();
    SlideState.isFullscreen = false;
  }
}

function exitFullscreen() {
  document.exitFullscreen?.();
  SlideState.isFullscreen = false;
}

document.addEventListener('fullscreenchange', () => {
  SlideState.isFullscreen = !!document.fullscreenElement;
  const btn = document.getElementById('fullscreenBtn');
  if (btn) {
    btn.setAttribute('aria-label',
      SlideState.isFullscreen ? 'Quitter le plein écran' : 'Plein écran'
    );
  }
  // Recalculer le scaling
  computeAndApplyScale();
});

/* =============================================
   BROADCAST CHANNEL (sync vue présentateur)
   ============================================= */

function initBroadcastChannel() {
  if (typeof BroadcastChannel === 'undefined') return;

  const channelName = `slides-${window.location.pathname}`;
  SlideState.broadcastChannel = new BroadcastChannel(channelName);

  SlideState.broadcastChannel.addEventListener('message', (e) => {
    if (e.data.type === 'GOTO') {
      goToSlide(e.data.index);
    }
    // Le présentateur demande l'état courant après son init
    if (e.data.type === 'PRESENTER_READY') {
      broadcastSlideChange();
    }
  });
}

function broadcastSlideChange() {
  if (!SlideState.broadcastChannel) return;

  const current = SlideState.slides[SlideState.currentIndex];
  const next = SlideState.slides[SlideState.currentIndex + 1];

  SlideState.broadcastChannel.postMessage({
    type: 'SLIDE_CHANGE',
    currentIndex: SlideState.currentIndex,
    totalSlides: SlideState.totalSlides,
    currentContent: current?.rawContent || '',
    currentNotes: current?.notes || '',
    nextContent: next?.rawContent || '',
    meta: SlideState.meta
  });
}

/* =============================================
   PARTAGE — COPIE DU LIEN AVEC HASH
   ============================================= */

function copySlideLink() {
  const url = window.location.href;
  const btn = document.getElementById('shareBtn');

  navigator.clipboard.writeText(url).then(() => {
    if (!btn) return;
    btn.classList.add('share-copied');
    btn.title = 'Lien copié !';
    setTimeout(() => {
      btn.classList.remove('share-copied');
      btn.title = 'Copier le lien de cette slide';
    }, 2000);
  }).catch(() => {
    /* Fallback pour les contextes sans clipboard API */
    prompt('Copiez ce lien :', url);
  });
}

/* =============================================
   VUE PRÉSENTATEUR
   ============================================= */

function openPresenterView() {
  const params = new URLSearchParams(window.location.search);
  params.set('slide', SlideState.currentIndex + 1);
  const presenterUrl = `presenter.html?${params.toString()}`;
  window.open(presenterUrl, 'slides-presenter', 'width=1200,height=800');
}

/* =============================================
   ERREUR
   ============================================= */

function showLoadError(message) {
  const stage = document.getElementById('slideStage');
  if (!stage) return;
  const div = document.createElement('div');
  div.className = 'slide-load-error';
  div.textContent = message;
  stage.appendChild(div);
}
