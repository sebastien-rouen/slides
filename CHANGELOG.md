# Changelog — Slides

## [Non publie] — 2026-04-24

### Ajouté
- Éditeur : bouton refresh image dans la toolbar (`#editorImgRefreshBtn`) avec badge dynamique — 0 image (grisé), 1 image (bleu), 2+ images (violet + compteur)
- Éditeur : `refreshImageAtCursor()` — insert un placeholder `![Description]()` si aucune image, remplace directement si une seule, affiche un sélecteur flottant si plusieurs
- Éditeur : `refreshImageByAlt(alt, blockEl)` — bouton secondaire sur chaque bloc image au survol (icône rafraîchissement, positionné à gauche du bloc)
- Éditeur : support des images sans URL `![alt]()` comme requêtes de recherche Pexels (regex élargie)
- Backend : route `GET /api/routes-ai-slides/image-search?q=keywords` — recherche Pexels, retourne un résultat aléatoire parmi 15 avec `{url, urlBg, alt}`
- Backend : `extractAiDescription(markdown)` — extrait la ligne `DESCRIPTION: ...` en tête de réponse IA pour le frontmatter
- Backend : téléchargement de la miniature Pexels en JPEG (`thumbnail.jpg`) lors de `generate-and-create` (fallback SVG)
- Viewer : bouton partage dans la toolbar — copie `window.location.href` dans le presse-papiers, tooltip "Copié !" 2s
- Viewer : URLs avec slugs de slides — format `viewer.html#{date}-{id}:{slide-slug}` (ex: `viewer.html#2026-04-24-mon-talk:une-slide-titre`)
- Viewer : `computeSlideSlugs(slides)` — génère des slugs depuis les titres `#` (NFD + kebab + déduplication)
- Viewer : `resolveFileFromUrl()` gère le nouveau format de hash ; `?file=` toujours supporté en fallback

### Modifié
- Panneau IA redessiné : meilleur layout (sections étiquetées, textarea avec accent de bordure, chips de layout raccourcis), titre en couleur unie `#c4b5fd` (plus fiable que gradient clip-text)
- Panneau IA : champ URL image remplacé par un picker visuel deux états (vide : boutons Pexels + Galerie ; rempli : miniature + Changer + Effacer)
- Pexels : `urlBg = p.src.original` pour les fonds (sans limite de taille), `url = p.src.large2x` (1880px) pour les images de contenu
- Bouton galerie dans le panneau IA : couleur visible (`#c4b5fd` sur fond `#a78bfa` transparent)
- Modèle IA : Claude remplace Mammouth/Gemini dans `routes-ai-slides.js`

---

## [Non publie] — 2026-04-22

### Ajouté
- Génération IA de présentations via Mammouth (Gemini 2.5 Flash)
- `index.html` : bouton "✨ Générer avec l'IA" dans le hero — ouvre une zone avec champs (sujet, public, nombre de slides, style, langue, contexte) et aperçu du prompt éditable
- `viewer.html` : bouton "✨ IA" dans la barre de format — ouvre une zone inline pour générer des slides et les insérer dans l'éditeur
- Backend : route `POST /api/routes-ai-slides/generate` (viewer) et `POST /api/routes-ai-slides/generate-and-create` (index — crée directement la présentation + thumbnail SVG + redirection viewer)
- CSS : `assets/css/modules/ai-slides.css` — chips, spinner, zone prompt, bouton gradient violet→bleu
- Prompt enrichi : frontmatter, 7 types de slides (cover, image-right, image-left, tableau, code, comparaison, CTA), notes présentateur obligatoires, alternance de layouts
- Intégration Pexels API optionnelle : si `PEXELS_API_KEY` configurée, fetch 8 images landscape injectées dans le contexte Gemini (3 fonds cover `large2x` + 5 images contenu `large`)

---

## [Non publie] — 2026-03-09

### Ajouté
- Éditeur : groupe de boutons dans la toolbar (visible en mode édition) — ajouter, dupliquer et supprimer une slide
- Éditeur : bouton "Ajouter une slide" (+) insère une slide vide après la courante avec animation pop-in
- Éditeur : bouton "Supprimer la slide" (corbeille) avec confirmation native et animation de sortie (scale-down + fade-out)
- Éditeur : animation flash sur la slide dupliquée (bordure couleur primaire)
- Viewer : sélecteur de zoom (Auto, 100%, 75%, 50%, A3, A4, A5)

### Modifié
- Le bouton "Dupliquer" est déplacé du panneau éditeur vers la toolbar principale
- Template Octo : couleurs inline sur les titres et textes, ajustements de positions

---

## [1.3.0] — 2026-03-05

### Ajouté
- Éditeur : coloration du texte sélectionné — palette de 8 couleurs preset + color picker personnalisé (hex)
- Éditeur : alignement du texte — boutons gauche, centre, droite (`<div style="text-align:...">`)
- Éditeur : le cadre de sélection d'un bloc reste visible jusqu'au clic ailleurs (plus de disparition après 1s)
- Éditeur : clic sur un bloc de la slide sélectionne le texte correspondant dans le textarea

### Corrigé
- DOMPurify : attribut `style` autorisé pour préserver les couleurs et alignements inline

## [1.2.0] — 2026-03-04

### Ajouté
- Vue présentateur : ouverture sur la slide courante via `?slide=N` + handshake BroadcastChannel `PRESENTER_READY`
- Vue présentateur : actualisation automatique du contenu après sauvegarde dans l'éditeur
- Homepage : modale d'édition des métadonnées d'une présentation (titre, auteur, description, tags, date)
- Homepage : upload de thumbnail dans la modale d'édition (clic + drag & drop, prévisualisation)
- Éditeur : positionnement per-element par drag & drop — chaque titre, texte, liste ou image est déplaçable individuellement
- Directive `<!-- positions: 0:l,t,w | 1:l,t,w -->` pour positionner chaque élément en absolu sur la slide
- Mode position : clic sur le bouton fleches, chaque element affiche ses bordures, clic pour sélectionner, drag pour déplacer, poignées pour redimensionner
- Auto-calcul des positions initiales depuis le flow naturel au premier clic
- Template "Octo Technology" avec fonds bleu marine et formes organiques (7 images de fond)
- Éditeur : textarea dédié pour les notes présentateur (séparé du contenu principal)
- Export PDF : impression corrigée — ratio 16:9 respecté, images de fond préservées, free-layout fonctionnel
- Éditeur : raccourci Ctrl+D pour dupliquer la slide courante (bouton Dupliquer ajouté)
- Éditeur : raccourci Ctrl+S global (fonctionne même sans focus sur le textarea)
- Éditeur : slider d'opacité du fond dans la toolbar — contrôle l'image de fond via `--bg-opacity` dans `<!-- style: -->`
- Éditeur : boutons images regroupés en fin de toolbar
- Homepage : renommer le dossier d'une présentation quand le titre change (API + frontend)
- Homepage : bouton Supprimer dans la modale d'édition (confirmation + suppression dossier + registre)
- Homepage : modale d'édition redessinée — layout 2 colonnes (champs + thumbnail), icônes SVG, focus glow
- Homepage : tags en chips interactifs dans la modale d'édition (Entrée/virgule pour ajouter, Backspace pour retirer, clic × pour supprimer)

### Corrigé
- Background-image des slides : conflit avec l'overlay de lisibilité (`slide-engine.css`) résolu — utilisation d'un élément DOM réel `.slide-bg-layer` au lieu de `::before`
- Hover drag & drop : cadre de positionnement fiabilisé — ré-application défensive des positions dans le DOM
- Rendu initial des slides : contenu propre (sans directives HTML) pour cohérence avec la preview éditeur
- Positions : synchronisation de rawContent lors du commit drag (sauvegarde correcte)
- Directive `<!-- style: -->` : suppression effective quand la directive est retirée du markdown
- Nettoyage du hover positioning à la fermeture de l'éditeur
- Route API `PUT /routes-creator/update` pour modifier les métadonnées d'une présentation

## [1.1.0] — 2026-03-03

### Ajouté
- Homepage : regroupement des présentations par année (décroissant) avec en-têtes de section
- Style Picker : panneau de personnalisation visuelle des slides (bouton palette, raccourci `S`)
  - 5 presets : Sombre, Clair, Océan, Sunset, Forêt
  - Ajustements fins : couleur d'accent et police
  - Persistance dans localStorage
- Éditeur Markdown inline : édition en direct des slides dans le viewer (bouton crayon, raccourci `E`)
  - Split view : textarea à gauche, preview temps réel à droite
  - Sauvegarde via API Express (`POST /api/slides/editor/save`)
  - Raccourci Ctrl+S pour sauvegarder depuis le textarea
  - Mise à jour automatique en naviguant entre les slides
- Route API backend `routes-editor.js` : sauvegarde et chargement des fichiers `.md`
- 3 fichiers CSS de thèmes : `theme-ocean.css`, `theme-sunset.css`, `theme-forest.css`
- Raccourcis clavier : `S` (style picker), `E` (éditeur), `Escape` (fermer panneaux)

## [1.0.0] — 2026-03-03

### Ajouté
- Moteur de présentation vanilla JS complet
- Page d'accueil avec grille de cartes et filtres par tags
- Viewer plein écran avec scaling 16:9 automatique (1280x720)
- Navigation clavier (flèches, espace, Home, End), souris et touch (swipe)
- Deep linking via hash (#N = slide N)
- Vue présentateur avec BroadcastChannel (sync bidirectionnelle)
- Minuterie avec avertissements couleur (> 20 min, > 30 min)
- Notes du présentateur (`<!-- notes -->`)
- Export PDF via @media print + window.print()
- Plein écran natif (Fullscreen API)
- Rendu Markdown avec marked.js
- Coloration syntaxique via highlight.js (thème github-dark)
- Diagrammes Mermaid
- Formules mathématiques KaTeX
- Sanitisation XSS via DOMPurify
- Dark theme par défaut, light theme optionnel avec toggle
- Design tokens BastaVerse (CSS variables)
- Présentation démo : "BastaVerse — De la catastrophe au homelab" (10 slides)
- Logo SVG
- Architecture CSS modulaire (14 fichiers)
