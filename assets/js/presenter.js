/**
 * presenter.js — Vue présentateur (fenêtre secondaire)
 *
 * Communique avec le viewer principal via BroadcastChannel.
 * Affiche : slide courante, aperçu suivante, notes, minuterie.
 */

/* =============================================
   ÉTAT
   ============================================= */

const PresenterState = {
  channel: null,
  currentIndex: 0,
  totalSlides: 0,
  timerSeconds: 0,
  timerRunning: false,
  timerInterval: null,
  slides: [],
  meta: {}
};

const P_SLIDE_WIDTH = 1280;
const P_SLIDE_HEIGHT = 720;

/* =============================================
   INITIALISATION
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const file = getUrlParam('file');
  if (!file) {
    document.body.textContent = 'Aucune présentation spécifiée.';
    return;
  }

  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();

    const { meta, slides } = parsePresentation(markdown);
    PresenterState.slides = slides;
    PresenterState.meta = meta;
    PresenterState.totalSlides = slides.length;

    document.title = `Présentateur — ${meta.title || file}`;

    // Démarrer sur la slide indiquée par le paramètre ?slide=N
    const slideParam = getUrlParam('slide');
    const startIndex = slideParam
      ? Math.max(0, Math.min(parseInt(slideParam, 10) - 1, slides.length - 1))
      : 0;
    PresenterState.currentIndex = startIndex;

    await displayCurrentSlide(startIndex);
    await displayNextSlide(startIndex);
    updatePresenterNotes(slides[startIndex]?.notes || '');
    updatePresenterCounter(startIndex, slides.length);

  } catch (error) {
    document.body.textContent = 'Erreur de chargement de la présentation.';
    return;
  }

  initPresenterBroadcast();
  initTimerControls();
  initPresenterKeyboard();
  initPresenterButtons();
  scalePresenterViewports();
  window.addEventListener('resize', throttle(scalePresenterViewports, 100));
});

/* =============================================
   AFFICHAGE
   ============================================= */

async function displayCurrentSlide(index) {
  const slide = PresenterState.slides[index];
  if (!slide) return;

  const viewport = document.getElementById('presenterCurrentViewport');
  if (!viewport) return;

  viewport.innerHTML = '';
  const slideEl = createPresenterSlide(slide);
  viewport.appendChild(slideEl);
  await postProcessSlide(slideEl);
}

async function displayNextSlide(index) {
  const slide = PresenterState.slides[index + 1];
  const viewport = document.getElementById('presenterNextViewport');
  if (!viewport) return;

  viewport.innerHTML = '';

  if (slide) {
    const slideEl = createPresenterSlide(slide);
    viewport.appendChild(slideEl);
    await postProcessSlide(slideEl);
  } else {
    const endMsg = document.createElement('div');
    endMsg.className = 'slide active';
    endMsg.style.cssText = 'align-items:center;justify-content:center;text-align:center;';
    const p = document.createElement('p');
    p.textContent = 'Fin de la présentation';
    p.style.color = 'var(--text-tertiary)';
    endMsg.appendChild(p);
    viewport.appendChild(endMsg);
  }
}

/**
 * Crée un élément slide pour le presenter (avec layouts + directives)
 * @param {Object} slide - Slide parsée
 * @returns {HTMLElement}
 */
function createPresenterSlide(slide) {
  const slideEl = document.createElement('div');
  slideEl.className = 'slide active';
  slideEl.dataset.layout = slide.layout;
  if (slide.cssClass) slide.cssClass.split(/\s+/).forEach(c => slideEl.classList.add(c));
  if (slide.cssStyle) slideEl.style.cssText += slide.cssStyle;

  // Re-extraire les directives pour avoir les données fraîches (rawContent peut changer via broadcast)
  const { content: cleanContent, directives } = extractDirectives(slide.rawContent);
  const { content: finalContent } = extractNotes(cleanContent);

  const html = renderMarkdown(finalContent);
  slideEl.innerHTML = html;

  // Appliquer le layout d'image/iframe (même logique que le viewer)
  if (typeof applyImageLayout === 'function') {
    applyImageLayout(slideEl, slide.layout, slide.iframeUrl);
  }

  // Positionnement per-element
  const positions = directives.positions || slide.positions;
  if (positions && typeof applyElementPositions === 'function') {
    applyElementPositions(slideEl, positions);
  }

  return slideEl;
}

function updatePresenterNotes(notesText) {
  const notesEl = document.getElementById('presenterNotes');
  if (!notesEl) return;

  // Garder le label
  const label = notesEl.querySelector('.presenter-notes-label');
  const labelHtml = label ? label.outerHTML : '';

  if (notesText) {
    notesEl.innerHTML = labelHtml;
    const p = document.createElement('p');
    p.textContent = notesText;
    notesEl.appendChild(p);
  } else {
    notesEl.innerHTML = labelHtml;
    const p = document.createElement('p');
    p.className = 'presenter-notes-empty';
    p.textContent = 'Aucune note pour cette slide.';
    notesEl.appendChild(p);
  }
}

function updatePresenterCounter(index, total) {
  const el = document.getElementById('presenterCounter');
  if (el) el.textContent = `${index + 1} / ${total}`;
}

/* =============================================
   SCALING DES VIEWPORTS PRESENTATEUR
   ============================================= */

function scalePresenterViewports() {
  scaleViewportInContainer('presenterCurrentViewport', '.presenter-current');
  scaleViewportInContainer('presenterNextViewport', '.presenter-next-container');
}

function scaleViewportInContainer(viewportId, containerSelector) {
  const viewport = document.getElementById(viewportId);
  const container = document.querySelector(containerSelector);
  if (!viewport || !container) return;

  const cW = container.clientWidth;
  const cH = container.clientHeight;
  const scale = computeSlideScale(cW, cH, P_SLIDE_WIDTH, P_SLIDE_HEIGHT);

  // Dimensions et centrage du viewport dans son conteneur
  const scaledW = P_SLIDE_WIDTH * scale;
  const scaledH = P_SLIDE_HEIGHT * scale;
  const offsetX = Math.max(0, (cW - scaledW) / 2);
  const offsetY = Math.max(0, (cH - scaledH) / 2);

  viewport.style.width = `${P_SLIDE_WIDTH}px`;
  viewport.style.height = `${P_SLIDE_HEIGHT}px`;
  viewport.style.transform = `scale(${scale})`;
  viewport.style.transformOrigin = 'top left';
  viewport.style.position = 'absolute';
  viewport.style.left = `${offsetX}px`;
  viewport.style.top = `${offsetY}px`;
}

/* =============================================
   BROADCAST CHANNEL
   ============================================= */

function initPresenterBroadcast() {
  if (typeof BroadcastChannel === 'undefined') return;

  // Même nom de canal que le viewer
  const viewerPath = window.location.pathname.replace('presenter.html', 'viewer.html');
  PresenterState.channel = new BroadcastChannel(`slides-${viewerPath}`);

  // Demander l'état courant au viewer
  PresenterState.channel.postMessage({ type: 'PRESENTER_READY' });

  PresenterState.channel.addEventListener('message', async (e) => {
    if (e.data.type !== 'SLIDE_CHANGE') return;

    const { currentIndex, totalSlides, currentContent, currentNotes, nextContent } = e.data;
    PresenterState.currentIndex = currentIndex;
    PresenterState.totalSlides = totalSlides;

    // Mettre à jour les données locales avec le contenu frais du viewer
    if (currentContent !== undefined && PresenterState.slides[currentIndex]) {
      PresenterState.slides[currentIndex].rawContent = currentContent;
      PresenterState.slides[currentIndex].notes = currentNotes || '';
    }
    if (nextContent && PresenterState.slides[currentIndex + 1]) {
      PresenterState.slides[currentIndex + 1].rawContent = nextContent;
    }

    await displayCurrentSlide(currentIndex);
    await displayNextSlide(currentIndex);
    updatePresenterNotes(currentNotes);
    updatePresenterCounter(currentIndex, totalSlides);
    scalePresenterViewports();
  });
}

/* =============================================
   NAVIGATION AUTONOME
   ============================================= */

function presenterGoTo(index) {
  if (index < 0 || index >= PresenterState.totalSlides) return;
  PresenterState.currentIndex = index;

  displayCurrentSlide(index);
  displayNextSlide(index);
  updatePresenterNotes(PresenterState.slides[index]?.notes || '');
  updatePresenterCounter(index, PresenterState.totalSlides);
  scalePresenterViewports();

  // Envoyer au viewer
  if (PresenterState.channel) {
    PresenterState.channel.postMessage({ type: 'GOTO', index });
  }
}

function initPresenterButtons() {
  document.getElementById('presenterPrev')?.addEventListener('click', () => {
    presenterGoTo(PresenterState.currentIndex - 1);
  });
  document.getElementById('presenterNext')?.addEventListener('click', () => {
    presenterGoTo(PresenterState.currentIndex + 1);
  });
}

function initPresenterKeyboard() {
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        presenterGoTo(PresenterState.currentIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        presenterGoTo(PresenterState.currentIndex - 1);
        break;
    }
  });
}

/* =============================================
   MINUTERIE
   ============================================= */

function initTimerControls() {
  document.getElementById('timerStart')?.addEventListener('click', toggleTimer);
  document.getElementById('timerReset')?.addEventListener('click', resetTimer);
}

function toggleTimer() {
  if (PresenterState.timerRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  PresenterState.timerRunning = true;
  updateTimerButton();

  PresenterState.timerInterval = setInterval(() => {
    PresenterState.timerSeconds++;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  PresenterState.timerRunning = false;
  clearInterval(PresenterState.timerInterval);
  updateTimerButton();
}

function resetTimer() {
  pauseTimer();
  PresenterState.timerSeconds = 0;
  renderTimer();
}

function renderTimer() {
  const display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = formatTime(PresenterState.timerSeconds);
  }

  const timer = document.getElementById('presenterTimer');
  if (timer) {
    timer.classList.toggle('warning', PresenterState.timerSeconds > 1200);
    timer.classList.toggle('danger', PresenterState.timerSeconds > 1800);
  }
}

function updateTimerButton() {
  const btn = document.getElementById('timerStart');
  if (!btn) return;

  if (PresenterState.timerRunning) {
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    btn.setAttribute('aria-label', 'Pause minuterie');
  } else {
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    btn.setAttribute('aria-label', 'Démarrer minuterie');
  }
}
