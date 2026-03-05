# slides — Moteur de présentation BastaVerse

## Description
Moteur de présentation vanilla JS qui rend des fichiers Markdown en slideshows.
Pas de framework, pas de build step, fonctionne via un serveur HTTP simple.

## Architecture
- `index.html` — Page listing des présentations (cartes, filtres par tags)
- `viewer.html` — Moteur de rendu plein écran (16:9, scaling automatique)
- `presenter.html` — Vue présentateur (BroadcastChannel, minuterie, notes)
- `config/presentations.json` — Registre des présentations (source de vérité)
- `pages/{id}/main.md` — Fichier Markdown d'une présentation

## Format Markdown des slides

```markdown
---
title: Titre de la présentation
author: Nom de l'auteur
date: 2026-03-03
---

# Première slide (titre)

Contenu ici

<!-- notes
Notes du présentateur (visibles uniquement dans la vue présentateur)
-->

---

## Deuxième slide

- Point 1
- Point 2
```

- Séparateur de slides : `\n---\n` (ligne avec uniquement trois tirets)
- Frontmatter : bloc YAML entre `---` en début de fichier (title, author, date)
- Notes présentateur : `<!-- notes\nContenu\n-->`
- Blocs mermaid : ` ```mermaid ` pour les diagrammes
- Formules KaTeX : `$inline$` ou `$$display$$`

## Directives par slide (personnalisation)

Ajouter en début de slide (avant le contenu) :

```markdown
<!-- layout: image-right -->
<!-- class: ma-classe -->
<!-- style: background: linear-gradient(135deg, #1a1a2e, #16213e) -->
```

### Layouts disponibles

| Layout | Effet |
|--------|-------|
| `title` | Centré, auto-détecté sur la 1ère slide |
| `section` | Centré avec fond dégradé, auto-détecté si slide courte |
| `content` | Layout par défaut (colonne) |
| `image-right` | Grille 2 colonnes : texte à gauche, image à droite |
| `image-left` | Grille 2 colonnes : image à gauche, texte à droite |
| `cover` | Image en arrière-plan plein écran avec overlay sombre |
| `image` | Image en arrière-plan (contain) avec texte superposé |

### Directives CSS

- `<!-- class: nom-classe -->` — Ajoute des classes CSS à la slide
- `<!-- style: propriete: valeur; ... -->` — Ajoute du CSS inline à la slide
- Plusieurs directives combinables sur la même slide

### Chemins d'images

Les images référées dans le Markdown doivent être relatives à la racine du site (où se trouve `viewer.html`) :
```markdown
![Photo](pages/mon-talk/images/photo.jpg)
```

## Bibliothèques CDN (viewer.html et presenter.html)
- **marked.js** v15 (UMD) — Parser Markdown
- **marked-highlight** v2 (UMD) — Bridge marked + highlight.js
- **highlight.js** v11.11 + github-dark — Coloration syntaxique
- **DOMPurify** v3.2 — Sanitisation XSS (obligatoire avant innerHTML)
- **KaTeX** v0.16 + auto-render — Formules mathématiques
- **Mermaid** v11 (ESM) — Diagrammes (chargé dans un `<script type="module">` séparé)

## Scaling des slides
Largeur logique fixe : 1280px x 720px (16:9)
Scale calculé via `transform: scale()` dans `slide-engine.js` → `computeAndApplyScale()`

## Thème global (dark/light)
- Pas de `data-theme` = thème sombre (défaut)
- `[data-theme="light"]` = surcharges dans `themes/theme-light.css`
- Toggle persiste dans `localStorage` (clé : `slides-theme`)

## Thèmes visuels des slides (Style Picker)
- Bouton palette dans la toolbar du viewer (raccourci `S`)
- 5 presets : Sombre (défaut), Clair, Océan, Sunset, Forêt
- Fichiers CSS : `themes/theme-{ocean,sunset,forest}.css`
- Sélecteur : `[data-slide-theme="xxx"]` sur `<html>` (distinct de `data-theme`)
- Fine-tuning : couleur d'accent (`--primary-color`), police (system, serif, mono)
- Persistance dans `localStorage` (clé : `slides-slide-theme`)
- Logique dans `assets/js/theme-manager.js` (objet `ThemeManager`)

## Éditeur Markdown inline
- Bouton crayon dans la toolbar du viewer (raccourci `E`)
- Split view : textarea à gauche, slide preview à droite
- Preview temps réel (debounced 300ms) via `renderMarkdown()` + `postProcessSlide()`
- Sauvegarde via API : `POST /api/routes-editor/save` (fichier `.md` sur le disque)
- Chargement via API : `GET /api/routes-editor/load?file=...`
- Route API : `api-multi-sites/data/slides/api/routes/routes-editor.js`
- Logique dans `assets/js/slide-editor.js` (objet `SlideEditor`)
- Ctrl+S dans le textarea déclenche la sauvegarde
- Le contenu se met à jour en naviguant entre les slides

## Homepage — Regroupement par année
- Les présentations sont groupées par année (extraite du champ `date`)
- Années triées en décroissant (plus récentes en premier)
- En-tête de section avec année, compteur et ligne séparatrice
- Styles dans `modules/homepage.css` (`.year-section`, `.year-section-grid`)

## Raccourcis clavier (viewer)
| Touche | Action |
|--------|--------|
| Flèche droite / Bas / Espace | Slide suivante |
| Flèche gauche / Haut | Slide précédente |
| Home | Première slide |
| End | Dernière slide |
| F | Plein écran |
| P | Vue présentateur |
| S | Style picker (thème visuel) |
| E | Éditeur Markdown |
| Escape | Quitter plein écran / fermer éditeur / fermer panneau |

## Communication viewer ↔ présentateur
- API : BroadcastChannel
- Canal : `slides-{pathname-du-viewer}`
- Messages : `SLIDE_CHANGE` (viewer → présentateur), `GOTO` (présentateur → viewer)

## API Backend
- Route éditeur : `api-multi-sites/data/slides/api/routes/routes-editor.js`
- `POST /api/routes-editor/save` — Sauvegarde le markdown complet d'une présentation
- `GET /api/routes-editor/load` — Charge le contenu brut d'un fichier markdown
- Sécurité : validation path traversal, restriction aux fichiers `pages/*.md`

## Règles spécifiques
- `innerHTML` autorisé UNIQUEMENT après `DOMPurify.sanitize()`
- `textContent` pour toutes les données utilisateur (titres, notes, descriptions)
- Mermaid exposé en `window.mermaid` par le bloc `<script type="module">`
- Scripts classiques (pas de type="module") sauf le bloc Mermaid

## Ajouter une présentation
1. Créer `pages/{id}/main.md` avec le format ci-dessus
2. Ajouter l'entrée dans `config/presentations.json`
3. La présentation apparaît sur la page d'accueil (groupée par année)
