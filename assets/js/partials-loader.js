/**
 * partials-loader.js — Chargement dynamique des fragments HTML (header, footer)
 * Doit être le PREMIER script chargé dans les pages qui utilisent des partials.
 */

/**
 * Charge un fichier HTML partiel et remplace le placeholder
 * @param {string} partialPath - Chemin vers le fichier partiel
 * @param {string} targetSelector - Sélecteur CSS du placeholder
 */
async function loadPartial(partialPath, targetSelector) {
  try {
    const response = await fetch(partialPath);
    if (!response.ok) return;
    const html = await response.text();
    const target = document.querySelector(targetSelector);
    if (target) {
      target.outerHTML = html;
    }
  } catch (error) {
    // Silencieux : les partials sont optionnels
  }
}

/**
 * Charge tous les partials déclarés et émet l'événement 'partialsLoaded'
 */
async function loadAllPartials() {
  const partials = [
    { path: 'partials/header.html', selector: '#header-placeholder' },
    { path: 'partials/footer.html', selector: '#footer-placeholder' }
  ];

  await Promise.all(
    partials.map(p => loadPartial(p.path, p.selector))
  );

  document.dispatchEvent(new CustomEvent('partialsLoaded'));
}

/* Lancement automatique */
document.addEventListener('DOMContentLoaded', loadAllPartials);
