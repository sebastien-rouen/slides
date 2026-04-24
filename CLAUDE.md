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

## URL des présentations (format hash)

Format : `viewer.html#{date}-{id}:{slide-slug}`
- `{date}-{id}` : identifie la présentation (ex: `2026-04-24-mon-talk`)
- `:{slide-slug}` : slug généré depuis le titre `#` de la slide (optionnel)
- Slug : NFD normalize → lowercase → kebab → max 60 chars, dédupliqués avec `-2`, `-3`
- Fallback : `?file=pages/{id}/main.md` (toujours supporté)
- `resolveFileFromUrl()` dans `slide-engine.js` gère la lecture du hash
- `computeSlideSlugs(slides)` recalcule les slugs après chaque modification
- `updateHash()` maintient l'URL en sync lors de la navigation

## Bouton partage

Bouton dans la toolbar du viewer (avant le bouton présentateur) :
- Copie `window.location.href` dans le presse-papiers
- Affiche tooltip "Copié !" 2s via classe `.share-copied` sur le bouton
- Implémenté dans `slide-engine.js` → `copySlideLink()`
- Style dans `assets/css/components/buttons.css` (`.btn-share`, `.btn-share.share-copied`)

## Éditeur — Refresh image

Bouton dans la format bar de l'éditeur (`#editorImgRefreshBtn`) :
- Badge dynamique : 0 image (grisé), 1 image (bleu), 2+ images (violet + badge avec compte)
- `updateImgRefreshBadge()` : mis à jour à chaque `input` du textarea
- `refreshImageAtCursor()` : 0 → insert placeholder `![Description]()` ; 1 → replace directe ; 2+ → picker flottant
- `refreshImageByAlt(alt, blockEl)` : appelé aussi depuis le bouton sur le bloc image au survol
- `_replaceImageInText()` : remplace l'URL en conservant le texte alt original
- Pexels : `GET /api/routes-ai-slides/image-search?q=keywords` (retourne `{url, urlBg, alt}`)
- Tailles Pexels : `urlBg = p.src.original` (fond, sans limite), `url = p.src.large2x` (1880px, contenu)
- Détection bg : `imgData.alt === 'bg'` → utilise `urlBg`
- Regex images : `/!\[([^\]]*)\]\(([^)]*)\)/g` (capture URL vide `()` aussi)

## Éditeur — Bloc image (drag position)

`slide-drag-position.js` → `selectBlock()` :
- Ajoute bouton `.slide-block-img-refresh` si le bloc contient une `<img>`
- Bouton positionné `top:30px; left:-32px` (en dessous du bouton couleur)
- Appelle `SlideEditor.refreshImageByAlt(img.alt, blockEl)`

## Panneau IA (ai-slides.js)

Bouton étoile dans la toolbar du viewer :
- Textarea `.ai-edit-prompt` : description de la modification
- Layout : chips de sélection (Img →, ← Img, A/B…)
- Modèle : `<select>` (Claude model)
- Image picker deux états :
  - **Vide** (`#aiEditImgEmpty`) : bouton Pexels + bouton Galerie
  - **Rempli** (`#aiEditImgFilled`) : miniature + bouton Changer + bouton Effacer
  - Valeur stockée dans `<input type="hidden" id="aiEditImageUrl">`
- `_setImage(url)` : bascule entre les deux états, met à jour la miniature
- `_searchPexels()` : extrait mots-clés depuis le prompt (filtre stop-words FR), appelle image-search
- Réinitialise le picker après génération réussie

## API Backend

Routes source dans `slides/api/routes/` (sync auto → `api-multi-sites/data/slides/api/routes/`)

| Route | Description |
|-------|-------------|
| `GET /api/routes-editor/load?file=...` | Charge le Markdown brut |
| `POST /api/routes-editor/save` | Sauvegarde le Markdown (validation path traversal) |
| `GET /api/routes-ai-slides/image-search?q=keywords` | Recherche Pexels (15 résultats, retourne 1 aléatoire) |
| `POST /api/routes-ai-slides/generate-and-create` | Génère via Claude + crée la présentation |

`routes-ai-slides.js` :
- `extractAiDescription(markdown)` : lit la ligne `DESCRIPTION: ...` en tête de réponse IA
- `fetchPexelsImages(keywords, apiKey, perPage)` : `urlBg: p.src.original`, `urlContent: p.src.large2x`
- Télécharge la miniature Pexels en JPEG (`thumbnail.jpg`) lors de `generate-and-create`, SVG en fallback
- SYSTEM_PROMPT : impose `DESCRIPTION: phrase courte` en première ligne de la réponse

## Règles spécifiques
- `innerHTML` autorisé UNIQUEMENT après `DOMPurify.sanitize()`
- `textContent` pour toutes les données utilisateur (titres, notes, descriptions)
- Mermaid exposé en `window.mermaid` par le bloc `<script type="module">`
- Scripts classiques (pas de type="module") sauf le bloc Mermaid
- Routes à éditer dans `slides/api/routes/` — jamais directement dans `api-multi-sites/data/`

## Ajouter une présentation
1. Créer `pages/{id}/main.md` avec le format ci-dessus
2. Ajouter l'entrée dans `config/presentations.json`
3. La présentation apparaît sur la page d'accueil (groupée par année)
