/**
 * utils.js — Utilitaires partagés (thème, helpers)
 */

/* =============================================
   THEME
   ============================================= */

const THEME_KEY = 'slides-theme';

/**
 * Initialise le thème depuis localStorage ou préférence système
 */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light') {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
  updateThemeIcon();
}

/**
 * Bascule le thème dark <-> light
 */
function toggleTheme() {
  const isLight = document.documentElement.dataset.theme === 'light';
  if (isLight) {
    delete document.documentElement.dataset.theme;
    localStorage.setItem(THEME_KEY, 'dark');
  } else {
    document.documentElement.dataset.theme = 'light';
    localStorage.setItem(THEME_KEY, 'light');
  }
  updateThemeIcon();
}

/**
 * Met à jour l'icône du bouton thème (soleil / lune)
 */
function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;

  const isLight = document.documentElement.dataset.theme === 'light';
  if (isLight) {
    // Icône lune
    icon.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
  } else {
    // Icône soleil
    icon.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
  }
}

/**
 * Attache le listener du bouton theme apres chargement des partials
 */
function bindThemeToggle() {
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

/* Écouter l'événement partialsLoaded pour le header */
document.addEventListener('partialsLoaded', () => {
  bindThemeToggle();
  updateThemeIcon();
});

/* Aussi en direct si pas de partials (viewer/presenter) */
document.addEventListener('DOMContentLoaded', () => {
  bindThemeToggle();
  updateThemeIcon();
});

/* =============================================
   HELPERS
   ============================================= */

/**
 * Debounce classique
 * @param {Function} fn - Fonction à debouncer
 * @param {number} delay - Délai en ms
 * @returns {Function}
 */
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle classique
 * @param {Function} fn - Fonction à throttler
 * @param {number} limit - Intervalle minimum en ms
 * @returns {Function}
 */
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (inThrottle) return;
    fn.apply(this, args);
    inThrottle = true;
    setTimeout(() => { inThrottle = false; }, limit);
  };
}

/**
 * Lit un paramètre de l'URL
 * @param {string} name - Nom du paramètre
 * @returns {string|null}
 */
function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Formate un nombre de secondes en MM:SS ou HH:MM:SS
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Calcule le facteur de scale pour un viewport 16:9
 * @param {number} containerW - Largeur du conteneur
 * @param {number} containerH - Hauteur du conteneur
 * @param {number} slideW - Largeur logique de la slide
 * @param {number} slideH - Hauteur logique de la slide
 * @returns {number}
 */
function computeSlideScale(containerW, containerH, slideW, slideH) {
  const scaleX = containerW / slideW;
  const scaleY = containerH / slideH;
  return Math.min(scaleX, scaleY);
}

/**
 * Formate une date ISO en format lisible
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
