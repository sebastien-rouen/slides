/**
 * slide-renderer.js — Rendu Markdown vers HTML avec marked, highlight.js, KaTeX, Mermaid
 *
 * Dépend de (chargés via CDN dans viewer.html / presenter.html) :
 *   - marked (global: marked)
 *   - markedHighlight (global: markedHighlight)
 *   - hljs (global: hljs)
 *   - DOMPurify (global: DOMPurify)
 *   - katex + renderMathInElement (global)
 *   - mermaid (global, chargé en ESM, disponible après event mermaidReady)
 */

/* Instance marked configurée (initialisée au premier appel) */
let markedInstance = null;

/**
 * Initialise l'instance marked avec highlight.js
 */
function initMarked() {
  if (markedInstance) return;
  if (typeof marked === 'undefined') return;

  markedInstance = new marked.Marked();

  // Intégration highlight.js si disponible
  if (typeof markedHighlight !== 'undefined' && typeof hljs !== 'undefined') {
    markedInstance.use(
      markedHighlight.markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          if (lang === 'mermaid') return code;
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        }
      })
    );
  }

  // Override renderer pour les blocs mermaid
  markedInstance.use({
    renderer: {
      code({ text, lang }) {
        if (lang === 'mermaid') {
          return `<div class="mermaid">${escapeHtml(text)}</div>`;
        }
        return false;
      }
    }
  });
}

/**
 * Échappe les caractères HTML dangereux
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Prétraite le Markdown : ajoute deux espaces en fin de ligne sur les lignes
 * de paragraphe consécutives pour forcer les <br> (méthode Markdown standard,
 * indépendante de l'option breaks de marked).
 * Ignore les blocs de code, titres, listes, blockquotes, HTML, séparateurs.
 * @param {string} content
 * @returns {string}
 */
/**
 * Prétraite le Markdown pour rendre les sauts de ligne visibles dans le rendu :
 * - Ligne de paragraphe suivie d'une autre sans ligne vide → <br> injecté directement
 * - Ligne vide entre deux blocs de contenu → remplacée par <br class="md-spacer">
 * Ignore les blocs de code, titres, listes, blockquotes, HTML, séparateurs.
 * @param {string} content
 * @returns {string}
 */
function addMarkdownLineBreaks(content) {
  const lines = content.split('\n');
  let inCodeBlock = false;
  const blockRe = /^(#{1,6}\s|[*+\-]\s|\d+\.\s|>\s?|<|<!--|\s{2,}|\|)/;
  const sepRe   = /^[=\-]{3,}\s*$/;

  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];

    if (/^```/.test(line)) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;

    const next = lines[i + 1];

    // Ligne vide : la remplacer par un spacer si entourée de contenu non-bloc
    if (line === '') {
      const prev = i > 0 ? lines[i - 1] : '';
      if (prev && next && !blockRe.test(prev) && !sepRe.test(prev)
                       && !blockRe.test(next) && !sepRe.test(next)) {
        lines[i] = '<br class="md-spacer">';
      }
      continue;
    }

    if (!next || next === '') continue;

    if (blockRe.test(line) || sepRe.test(line)) continue;
    if (blockRe.test(next) || sepRe.test(next)) continue;

    // Lignes de paragraphe consécutives : saut de ligne forcé
    lines[i] = line + '<br>';
  }

  return lines.join('\n');
}

/**
 * Rend du Markdown en HTML sanitisé
 * @param {string} markdownContent - Contenu Markdown
 * @returns {string} HTML sanitisé
 */
function renderMarkdown(markdownContent) {
  if (!markdownContent) return '';

  initMarked();
  if (!markedInstance) return markdownContent;

  const rawHtml = markedInstance.parse(addMarkdownLineBreaks(markdownContent));

  // Sanitisation XSS obligatoire
  if (typeof DOMPurify !== 'undefined') {
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['div'],
      ADD_ATTR: ['class', 'style']
    });
  }

  return rawHtml;
}

/**
 * Post-traitement d'un conteneur après injection HTML :
 * - Rendu KaTeX (formules mathématiques)
 * - Rendu Mermaid (diagrammes)
 * @param {HTMLElement} container - Élément DOM contenant le HTML rendu
 */
async function postProcessSlide(container) {
  if (!container) return;

  // KaTeX : rendu des formules
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }

  // Mermaid : rendu des diagrammes
  const mermaidBlocks = container.querySelectorAll('.mermaid');
  if (mermaidBlocks.length > 0 && window.mermaid) {
    try {
      await window.mermaid.run({ nodes: mermaidBlocks });
    } catch (error) {
      // Mermaid peut échouer sur certains diagrammes invalides
    }
  }
}

/**
 * Rend toutes les slides dans le viewport
 * @param {Array} slides - Tableau de slides parsées
 * @param {HTMLElement} viewport - Conteneur slide-viewport
 */
async function renderAllSlides(slides, viewport) {
  if (!viewport) return;
  viewport.innerHTML = '';

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideEl = document.createElement('div');
    slideEl.className = 'slide';
    slideEl.dataset.index = i;
    slideEl.dataset.layout = slide.layout;
    if (slide.cssClass) slide.cssClass.split(/\s+/).forEach(c => slideEl.classList.add(c));
    if (slide.cssStyle) slideEl.style.cssText = slide.cssStyle;
    if (i === 0) slideEl.classList.add('active');

    // Extraire directives et notes pour rendre le contenu propre (coherent avec updatePreview)
    const { content: withoutNotes } = extractNotes(slide.rawContent || '');
    const { content: cleanContent } = extractDirectives(withoutNotes);
    const html = renderMarkdown(cleanContent);
    slideEl.innerHTML = html;

    // Post-traitement layout : restructurer le DOM pour les layouts d'images/iframes
    applyImageLayout(slideEl, slide.layout, slide.iframeUrl);

    // Deplacer background-image vers CSS variable pour opacite controlable
    extractBgToVariable(slideEl);

    // Positionnement per-element si directive <!-- positions: 0:l,t,w | 1:l,t,w -->
    if (slide.positions) {
      applyElementPositions(slideEl, slide.positions);
    }

    // Post-traitement (KaTeX) — Mermaid sera fait après
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(slideEl, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }

    viewport.appendChild(slideEl);
  }

  // Mermaid : attendre qu'il soit prêt puis rendre
  await renderMermaidInViewport(viewport);
}

/**
 * Applique le layout d'image/iframe en restructurant le DOM de la slide
 * @param {HTMLElement} slideEl - Élément .slide
 * @param {string} layout - Type de layout
 * @param {string} [iframeUrl] - URL pour les layouts iframe
 */
function applyImageLayout(slideEl, layout, iframeUrl) {
  if (!slideEl || !layout) return;

  // Layouts iframe : pas besoin d'image, besoin d'une URL
  if (layout === 'iframe-right' || layout === 'iframe-left') {
    if (iframeUrl) applyIframeSplitLayout(slideEl, iframeUrl, layout);
    return;
  }

  const img = slideEl.querySelector('img');
  if (!img && layout !== 'section' && layout !== 'title') return;

  switch (layout) {
    case 'image-right':
    case 'image-left':
      applyImageSplitLayout(slideEl, img, layout);
      break;
    case 'cover':
      applyImageCoverLayout(slideEl, img);
      break;
    case 'image':
      applyImageFullLayout(slideEl, img);
      break;
  }
}

/**
 * Layout image-right / image-left : grille texte + image
 * @param {HTMLElement} slideEl
 * @param {HTMLElement} img
 * @param {string} layout
 */
function applyImageSplitLayout(slideEl, img, layout) {
  if (!img) return;

  // Récupérer le conteneur de l'image (souvent un <p>)
  const imgParent = img.parentElement;

  // Créer les deux colonnes
  const textCol = document.createElement('div');
  textCol.className = 'slide-text-col';

  const imageCol = document.createElement('div');
  imageCol.className = 'slide-image-col';

  // Déplacer tous les enfants dans la colonne texte
  while (slideEl.firstChild) {
    textCol.appendChild(slideEl.firstChild);
  }

  // Déplacer l'image (ou son parent <p>) dans la colonne image
  if (imgParent && imgParent.tagName === 'P' && imgParent.childNodes.length === 1) {
    imageCol.appendChild(imgParent);
  } else {
    imageCol.appendChild(img);
  }

  // Insérer dans le bon ordre selon le layout
  if (layout === 'image-left') {
    slideEl.appendChild(imageCol);
    slideEl.appendChild(textCol);
  } else {
    slideEl.appendChild(textCol);
    slideEl.appendChild(imageCol);
  }
}

/**
 * Layout cover : image en arrière-plan avec overlay
 * @param {HTMLElement} slideEl
 * @param {HTMLElement} img
 */
function applyImageCoverLayout(slideEl, img) {
  if (!img) return;

  const src = img.getAttribute('src');
  if (!src) return;

  // Définir l'image en arrière-plan
  slideEl.style.backgroundImage = `url("${src}")`;

  // Supprimer l'image du contenu
  const imgParent = img.parentElement;
  if (imgParent && imgParent.tagName === 'P' && imgParent.childNodes.length === 1) {
    imgParent.remove();
  } else {
    img.remove();
  }

  // Envelopper le contenu restant dans un overlay
  const overlay = document.createElement('div');
  overlay.className = 'slide-cover-overlay';
  while (slideEl.firstChild) {
    overlay.appendChild(slideEl.firstChild);
  }
  slideEl.appendChild(overlay);
}

/**
 * Layout image : image dominante avec texte superposé
 * @param {HTMLElement} slideEl
 * @param {HTMLElement} img
 */
function applyImageFullLayout(slideEl, img) {
  if (!img) return;

  const src = img.getAttribute('src');
  if (!src) return;

  // Définir l'image en arrière-plan
  slideEl.style.backgroundImage = `url("${src}")`;

  // Supprimer l'image du contenu
  const imgParent = img.parentElement;
  if (imgParent && imgParent.tagName === 'P' && imgParent.childNodes.length === 1) {
    imgParent.remove();
  } else {
    img.remove();
  }

  // Envelopper le contenu restant dans un overlay
  const overlay = document.createElement('div');
  overlay.className = 'slide-image-overlay';
  while (slideEl.firstChild) {
    overlay.appendChild(slideEl.firstChild);
  }
  slideEl.appendChild(overlay);
}

/**
 * Layout iframe-right / iframe-left : grille texte + iframe
 * @param {HTMLElement} slideEl
 * @param {string} url - URL à afficher dans l'iframe
 * @param {string} layout - 'iframe-right' ou 'iframe-left'
 */
function applyIframeSplitLayout(slideEl, url, layout) {
  // Créer les deux colonnes
  const textCol = document.createElement('div');
  textCol.className = 'slide-text-col';

  const iframeCol = document.createElement('div');
  iframeCol.className = 'slide-iframe-col';

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
  iframe.setAttribute('title', 'Apercu du site');
  iframeCol.appendChild(iframe);

  // Déplacer tout le contenu dans la colonne texte
  while (slideEl.firstChild) {
    textCol.appendChild(slideEl.firstChild);
  }

  // Insérer dans le bon ordre selon le layout
  if (layout === 'iframe-left') {
    slideEl.appendChild(iframeCol);
    slideEl.appendChild(textCol);
  } else {
    slideEl.appendChild(textCol);
    slideEl.appendChild(iframeCol);
  }
}

/**
 * Parse la directive positions et retourne une map index → coordonnees
 * Format : "0:25%,30%,50% | 1:25%,55%,50%,40%"
 * @param {string} positionsStr
 * @returns {Map<number, {left: string, top: string, width: string, height: string}>}
 */
function parsePositions(positionsStr) {
  const map = new Map();
  if (!positionsStr) return map;

  const entries = positionsStr.split('|').map(s => s.trim()).filter(Boolean);
  for (const entry of entries) {
    const colonIdx = entry.indexOf(':');
    if (colonIdx < 0) continue;
    const rawKey = entry.substring(0, colonIdx).trim();
    const parts = entry.substring(colonIdx + 1).split(',').map(s => s.trim());
    if (parts.length < 3) continue;
    const pos = { left: parts[0], top: parts[1], width: parts[2], height: parts[3] || 'auto', fontSize: parts[4] || null };
    if (rawKey.includes('/')) {
      map.set(rawKey, pos); // cle sous-bloc : 'parentIdx/childIdx'
    } else {
      const idx = parseInt(rawKey, 10);
      if (!isNaN(idx)) map.set(idx, pos);
    }
  }
  return map;
}

/**
 * Positionne chaque enfant direct de la slide selon la directive positions
 * @param {HTMLElement} slideEl - Element .slide
 * @param {string} positionsStr - Valeurs : "0:l,t,w[,h] | 1:l,t,w[,h]"
 */
function applyElementPositions(slideEl, positionsStr) {
  const posMap = parsePositions(positionsStr);
  if (posMap.size === 0) return;

  slideEl.classList.add('free-layout');

  const applyPos = (el, pos) => {
    el.style.position = 'absolute';
    el.style.left = pos.left;
    el.style.top = pos.top;
    el.style.width = pos.width;
    if (pos.height !== 'auto') el.style.height = pos.height;
    if (pos.fontSize) el.style.fontSize = pos.fontSize;
  };

  const children = Array.from(slideEl.children).filter(c => !c.classList.contains('slide-bg-layer'));
  children.forEach((child, i) => {
    child.classList.add('slide-pos-block');
    child.dataset.posIndex = i;
    const pos = posMap.get(i);
    if (pos) applyPos(child, pos);
  });

  // Sous-positions : format 'parentIdx/childIdx:l,t,w[,h]'
  for (const [key, pos] of posMap) {
    if (typeof key !== 'string' || !key.includes('/')) continue;
    const [pStr, cStr] = key.split('/');
    const parent = children[parseInt(pStr, 10)];
    if (!parent) continue;
    const subChildren = Array.from(parent.children).filter(
      c => !c.classList.contains('slide-pos-handle') && !c.classList.contains('slide-block-color-btn')
    );
    const child = subChildren[parseInt(cStr, 10)];
    if (!child) continue;
    child.classList.add('slide-sub-block');
    child.dataset.subPosIndex = cStr;
    applyPos(child, pos);
  }
}

/**
 * Deplace le background-image inline vers une CSS variable pour
 * permettre le controle d'opacite via ::before pseudo-element
 * @param {HTMLElement} slideEl
 */
function extractBgToVariable(slideEl) {
  const bgImage = slideEl.style.backgroundImage;
  if (!bgImage || bgImage === 'none') return;

  // Creer un element reel pour le fond (plus fiable que ::before)
  const layer = document.createElement('div');
  layer.className = 'slide-bg-layer';
  layer.style.backgroundImage = bgImage;
  layer.style.backgroundSize = slideEl.style.backgroundSize || 'cover';
  layer.style.backgroundPosition = slideEl.style.backgroundPosition || 'center';

  // Recuperer l'opacite depuis le style inline (directive <!-- style: --bg-opacity: X -->)
  const op = slideEl.style.getPropertyValue('--bg-opacity');
  if (op) layer.style.opacity = op;

  slideEl.insertBefore(layer, slideEl.firstChild);

  // Retirer le background du slide (removeProperty pour que [style*="background-image"] ne matche plus)
  slideEl.style.removeProperty('background-image');
  slideEl.style.removeProperty('background-size');
  slideEl.style.removeProperty('background-position');
  slideEl.classList.add('has-bg-image');
}

/**
 * Attend que Mermaid soit disponible et rend les diagrammes
 * @param {HTMLElement} viewport
 */
async function renderMermaidInViewport(viewport) {
  const mermaidBlocks = viewport.querySelectorAll('.mermaid');
  if (mermaidBlocks.length === 0) return;

  if (window.mermaid) {
    try {
      await window.mermaid.run({ nodes: mermaidBlocks });
    } catch (error) {
      // Diagramme invalide
    }
    return;
  }

  // Attendre l'événement mermaidReady
  return new Promise((resolve) => {
    const handler = async () => {
      window.removeEventListener('mermaidReady', handler);
      if (window.mermaid) {
        try {
          await window.mermaid.run({ nodes: mermaidBlocks });
        } catch (error) {
          // Diagramme invalide
        }
      }
      resolve();
    };
    window.addEventListener('mermaidReady', handler);

    // Timeout de sécurité : ne pas bloquer indéfiniment
    setTimeout(resolve, 5000);
  });
}
