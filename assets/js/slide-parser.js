/**
 * slide-parser.js — Parse un fichier Markdown en tableau de slides
 *
 * Format attendu :
 *   ---
 *   title: Titre
 *   author: Auteur
 *   date: 2026-03-03
 *   ---
 *
 *   # Contenu slide 1
 *
 *   <!-- notes
 *   Notes du présentateur
 *   -->
 *
 *   ---
 *
 *   ## Contenu slide 2
 */

/**
 * Parse le frontmatter YAML simplifié (clé: valeur)
 * @param {string} yamlBlock - Bloc YAML sans les délimiteurs ---
 * @returns {Object} Métadonnées
 */
function parseFrontmatter(yamlBlock) {
  const meta = {};
  const lines = yamlBlock.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w[\w-]*)\s*:\s*(.+)$/);
    if (match) {
      meta[match[1].trim()] = match[2].trim();
    }
  }
  return meta;
}

/**
 * Extrait les notes du présentateur d'un bloc de slide
 * Format : <!-- notes\nContenu des notes\n-->
 * @param {string} content - Contenu brut de la slide
 * @returns {{ content: string, notes: string }}
 */
function extractNotes(content) {
  const notesRegex = /<!--\s*notes\s*\n([\s\S]*?)-->/gi;
  let notes = '';
  let cleanContent = content;

  const match = notesRegex.exec(content);
  if (match) {
    notes = match[1].trim();
    cleanContent = content.replace(match[0], '').trim();
  }

  return { content: cleanContent, notes };
}

/**
 * Extrait les directives de slide depuis des commentaires HTML en début de slide
 * Formats supportés (un commentaire par directive) :
 *   <!-- layout: image-right -->
 *   <!-- class: ma-classe autre-classe -->
 *   <!-- style: background: red; color: white -->
 * @param {string} content - Contenu brut de la slide
 * @returns {{ content: string, directives: { layout: string|null, class: string|null, style: string|null } }}
 */
function extractDirectives(content) {
  const directives = { layout: null, class: null, style: null, url: null, positions: null };
  let cleaned = content.trim();

  // Extraire toutes les directives en début de slide (boucle)
  let found = true;
  while (found) {
    found = false;
    const match = cleaned.match(/^<!--\s*(layout|class|style|url|positions)\s*:\s*(.+?)\s*-->\s*\n?/i);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();
      if (key === 'layout') directives.layout = value.toLowerCase();
      else directives[key] = value;
      cleaned = cleaned.slice(match[0].length).trim();
      found = true;
    }
  }

  return { content: cleaned, directives };
}

/**
 * Détecte le layout d'une slide selon son contenu
 * @param {string} content - Contenu markdown de la slide
 * @param {number} index - Index de la slide
 * @returns {string} Type de layout : 'title', 'section', 'content'
 */
function detectLayout(content, index) {
  const lines = content.trim().split('\n').filter(l => l.trim().length > 0);

  // Image avec alt="bg" = layout cover (convention ![bg](url))
  if (lines.some(l => /^!\[bg\]/.test(l.trim()))) {
    return 'cover';
  }

  // Première slide avec un seul titre h1 = layout titre
  if (index === 0 && lines.length <= 5) {
    const hasH1 = lines.some(l => /^#\s+/.test(l));
    if (hasH1) return 'title';
  }

  // Slide avec uniquement un h2 et peu de contenu = section
  if (lines.length <= 3) {
    const hasH2 = lines.some(l => /^##\s+/.test(l));
    const noCode = !content.includes('```');
    if (hasH2 && noCode) return 'section';
  }

  return 'content';
}

/**
 * Parse une présentation Markdown complète
 * @param {string} markdown - Contenu Markdown brut
 * @returns {{ meta: Object, slides: Array<{ rawContent: string, notes: string, layout: string }> }}
 */
function parsePresentation(markdown) {
  let meta = {};
  let body = markdown;

  // Extraire le frontmatter (premier bloc ---)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const fmMatch = markdown.match(frontmatterRegex);
  if (fmMatch) {
    meta = parseFrontmatter(fmMatch[1]);
    body = markdown.slice(fmMatch[0].length);
  }

  // Séparer les slides sur \n---\n (ligne contenant uniquement ---)
  const slideBlocks = body.split(/\n---\s*\n/);

  const slides = slideBlocks
    .map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      const { content: withoutNotes, notes } = extractNotes(trimmed);
      const { content, directives } = extractDirectives(withoutNotes);
      const layout = directives.layout || detectLayout(content, index);

      return {
        rawContent: trimmed,
        notes,
        layout,
        cssClass: directives.class || null,
        cssStyle: directives.style || null,
        iframeUrl: directives.url || null,
        positions: directives.positions || null
      };
    })
    .filter(Boolean);

  return { meta, slides };
}
