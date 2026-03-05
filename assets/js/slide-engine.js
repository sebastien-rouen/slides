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
  broadcastChannel: null
};

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

/* =============================================
   INITIALISATION
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  const file = getUrlParam('file');
  if (!file) {
    showLoadError('Aucune présentation spécifiée. Ajoutez ?file=pages/xxx/main.md');
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

    // 3. Titre
    updatePageTitle(meta.title || file);

    // 4. Index depuis le hash
    const hashIndex = parseHashIndex();
    SlideState.currentIndex = Math.max(0, Math.min(hashIndex, slides.length - 1));

    // 5. Rendre les slides
    const viewport = document.getElementById('slideViewport');
    await renderAllSlides(slides, viewport);

    // 6. Afficher la slide courante
    showSlide(SlideState.currentIndex);

    // 7. Scaling
    computeAndApplyScale();

    // 8. Event listeners
    bindKeyboard();
    bindNavigationButtons();
    bindTouch();
    bindResize();

    // 9. BroadcastChannel
    initBroadcastChannel();

    // 10. Signaler que les slides sont pretes (pour ThemeManager, etc.)
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

function computeAndApplyScale() {
  const stage = document.getElementById('slideStage');
  const viewport = document.getElementById('slideViewport');
  if (!stage || !viewport) return;

  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;
  const scale = computeSlideScale(stageW, stageH, SLIDE_WIDTH, SLIDE_HEIGHT);

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
   BOUTONS DE NAVIGATION
   ============================================= */

function bindNavigationButtons() {
  document.getElementById('prevBtn')?.addEventListener('click', prevSlide);
  document.getElementById('nextBtn')?.addEventListener('click', nextSlide);
  document.getElementById('firstSlideBtn')?.addEventListener('click', firstSlide);
  document.getElementById('lastSlideBtn')?.addEventListener('click', lastSlide);
  document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);
  document.getElementById('presenterBtn')?.addEventListener('click', openPresenterView);
  document.getElementById('printBtn')?.addEventListener('click', () => {
    if (typeof preparePrint === 'function') preparePrint();
  });
}

/* =============================================
   HASH / DEEP LINKING
   ============================================= */

function parseHashIndex() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/?(\d+)$/);
  return match ? parseInt(match[1], 10) - 1 : 0;
}

function updateHash() {
  const newHash = `#${SlideState.currentIndex + 1}`;
  history.replaceState(null, '', newHash);
}

window.addEventListener('hashchange', () => {
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
