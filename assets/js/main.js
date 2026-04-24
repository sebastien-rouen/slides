/**
 * main.js — Page d'accueil : chargement des présentations et affichage en grille
 */

const AppState = {
  presentations: [],
  activeTag: 'all'
};

/* =============================================
   INITIALISATION
   ============================================= */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadPresentations();
    renderTagFilters();
    renderPresentations();
    bindTagFilters();
  } catch (error) {
    showEmptyState();
  }
});

/* =============================================
   CHARGEMENT DES DONNÉES
   ============================================= */

async function loadPresentations() {
  const response = await fetch('config/presentations.json');
  if (!response.ok) throw new Error('Impossible de charger presentations.json');
  const data = await response.json();
  AppState.presentations = data.presentations || [];
}

/* =============================================
   RENDU DES CARTES
   ============================================= */

function renderPresentations() {
  const container = document.getElementById('presentationsGrid');
  const emptyState = document.getElementById('emptyState');
  const countEl = document.getElementById('presentationsCount');
  if (!container) return;

  const filtered = getFilteredPresentations();
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    if (countEl) countEl.textContent = '';
    return;
  }

  container.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');
  if (countEl) {
    const total = filtered.length;
    countEl.textContent = `${total} présentation${total > 1 ? 's' : ''}`;
  }

  // Grouper par année (décroissant)
  const byYear = groupByYear(filtered);
  const years = Object.keys(byYear).sort((a, b) => b - a);

  years.forEach(year => {
    const items = byYear[year];
    const section = document.createElement('div');
    section.className = 'year-section';

    // En-tête de section
    const header = document.createElement('div');
    header.className = 'year-section-header';

    const title = document.createElement('h2');
    title.className = 'year-section-title';
    title.textContent = year;
    header.appendChild(title);

    const count = document.createElement('span');
    count.className = 'year-section-count';
    count.textContent = `${items.length}`;
    header.appendChild(count);

    const line = document.createElement('div');
    line.className = 'year-section-line';
    header.appendChild(line);

    section.appendChild(header);

    // Grille de cartes
    const grid = document.createElement('div');
    grid.className = 'year-section-grid';
    const sorted = [...items].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    sorted.forEach(pres => grid.appendChild(createPresentationCard(pres)));
    section.appendChild(grid);

    container.appendChild(section);
  });
}

/**
 * Crée une carte de présentation
 * @param {Object} pres - Données de la présentation
 * @returns {HTMLElement}
 */
function createPresentationCard(pres) {
  const card = document.createElement('article');
  card.className = 'presentation-card';
  card.setAttribute('role', 'link');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `Ouvrir ${pres.title}`);

  // Thumbnail
  const thumbDiv = document.createElement('div');
  thumbDiv.className = 'presentation-card-thumbnail';
  if (pres.thumbnail) {
    const img = document.createElement('img');
    img.src = pres.thumbnail;
    img.alt = pres.title;
    img.loading = 'lazy';
    thumbDiv.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'presentation-card-thumbnail-placeholder';
    const initials = getInitials(pres.title);
    placeholder.textContent = initials;
    thumbDiv.appendChild(placeholder);
  }
  card.appendChild(thumbDiv);

  // Corps
  const body = document.createElement('div');
  body.className = 'presentation-card-body';

  // Bouton modifier
  const editBtn = document.createElement('button');
  editBtn.className = 'presentation-card-edit';
  editBtn.setAttribute('aria-label', 'Modifier les infos');
  editBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (typeof EditPresentation !== 'undefined') EditPresentation.open(pres);
  });
  body.appendChild(editBtn);

  const title = document.createElement('h2');
  title.className = 'presentation-card-title';
  title.textContent = pres.title;
  body.appendChild(title);

  if (pres.description) {
    const desc = document.createElement('p');
    desc.className = 'presentation-card-description';
    desc.textContent = pres.description;
    body.appendChild(desc);
  }

  const meta = document.createElement('div');
  meta.className = 'presentation-card-meta';
  if (pres.author) {
    const author = document.createElement('span');
    author.textContent = pres.author;
    meta.appendChild(author);
  }
  if (pres.date) {
    const sep = document.createElement('span');
    sep.textContent = ' — ';
    meta.appendChild(sep);
    const date = document.createElement('span');
    date.textContent = formatDate(pres.date);
    meta.appendChild(date);
  }
  body.appendChild(meta);
  card.appendChild(body);

  // Footer avec tags
  if (pres.tags && pres.tags.length > 0) {
    const footer = document.createElement('div');
    footer.className = 'presentation-card-footer';
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'presentation-card-tags';
    pres.tags.forEach(tag => {
      const tagEl = document.createElement('span');
      tagEl.className = 'presentation-card-tag';
      tagEl.textContent = tag;
      tagsDiv.appendChild(tagEl);
    });
    footer.appendChild(tagsDiv);
    card.appendChild(footer);
  }

  // Navigation vers le viewer — format viewer.html#{date}-{id}
  const id = pres.id || pres.file.replace('pages/', '').replace('/main.md', '');
  const presPart = pres.date ? `${pres.date}-${id}` : id;
  const viewerUrl = `viewer.html#${presPart}`;
  const openViewer = () => { window.location.href = viewerUrl; };
  card.addEventListener('click', openViewer);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openViewer(); }
  });

  return card;
}

/* =============================================
   FILTRES PAR TAGS
   ============================================= */

function getAllTags() {
  const tagSet = new Set();
  AppState.presentations.forEach(p => {
    (p.tags || []).forEach(t => tagSet.add(t));
  });
  return Array.from(tagSet).sort();
}

function renderTagFilters() {
  const container = document.getElementById('tagFilters');
  if (!container) return;

  const tags = getAllTags();
  if (tags.length === 0) {
    container.classList.add('hidden');
    return;
  }

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'tag-filter';
    btn.dataset.tag = tag;
    btn.textContent = tag;
    container.appendChild(btn);
  });
}

function bindTagFilters() {
  const container = document.getElementById('tagFilters');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-filter');
    if (!btn) return;

    container.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    AppState.activeTag = btn.dataset.tag;
    renderPresentations();
  });
}

function getFilteredPresentations() {
  if (AppState.activeTag === 'all') return AppState.presentations;
  return AppState.presentations.filter(p =>
    (p.tags || []).includes(AppState.activeTag)
  );
}

/* =============================================
   HELPERS
   ============================================= */

function groupByYear(presentations) {
  const groups = {};
  presentations.forEach(pres => {
    const year = pres.date ? pres.date.substring(0, 4) : 'Sans date';
    if (!groups[year]) groups[year] = [];
    groups[year].push(pres);
  });
  return groups;
}

function getInitials(title) {
  if (!title) return '?';
  const words = title.split(/[\s—-]+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
}

function showEmptyState() {
  const grid = document.getElementById('presentationsGrid');
  const emptyState = document.getElementById('emptyState');
  if (grid) grid.classList.add('hidden');
  if (emptyState) emptyState.classList.remove('hidden');
}
