/**
 * pdf-export.js — Export PDF via window.print()
 *
 * Avant l'impression :
 *   - Ferme les panneaux ouverts (editeur, style picker)
 *   - Affiche toutes les slides via .print-visible
 *   - Le CSS @media print (print.css) gere la mise en page
 */

function preparePrint() {
  // Fermer les panneaux ouverts
  if (typeof ThemeManager !== 'undefined') ThemeManager.closePanel();
  if (typeof SlideEditor !== 'undefined' && SlideEditor.isActive) SlideEditor.deactivate();

  // Rendre toutes les slides visibles pour l'impression
  document.querySelectorAll('.slide').forEach(slide => {
    slide.classList.add('print-visible');
  });

  window.print();

  // Restaurer apres l'impression
  window.addEventListener('afterprint', restoreAfterPrint, { once: true });
}

function restoreAfterPrint() {
  document.querySelectorAll('.slide.print-visible').forEach(slide => {
    slide.classList.remove('print-visible');
  });
}
