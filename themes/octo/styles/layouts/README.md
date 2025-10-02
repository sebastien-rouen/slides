# Organisation des Layouts OCTO

Ce dossier contient tous les styles CSS des layouts du thème OCTO, organisés par fichier pour une maintenance facilitée.

## Structure des fichiers

### Layouts principaux
- `layout-default.css` - Layout par défaut avec styles de base
- `layout-cover.css` - Layouts de couverture (cover, cover-gradient)
- `layout-intro.css` - Layout d'introduction avec mise en valeur
- `layout-section.css` - Layout de section avec gradient
- `layout-two-cols.css` - Layout à deux colonnes
- `layout-center.css` - Layout centré avec grilles
- `layout-end.css` - Layout de fin avec contact

### Layouts spéciaux
- `layout-special.css` - Layouts spéciaux (quote, fact, image-left/right)

### Interface utilisateur
- `layout-ui.css` - Éléments d'interface Slidev (navigation, progress, etc.)
- `layout-utilities.css` - Classes utilitaires et helpers

## Import principal

Tous ces fichiers sont importés dans `../layout.css` :

```css
@import './layouts/layout-default.css';
@import './layouts/layout-cover.css';
@import './layouts/layout-intro.css';
@import './layouts/layout-section.css';
@import './layouts/layout-two-cols.css';
@import './layouts/layout-center.css';
@import './layouts/layout-end.css';
@import './layouts/layout-special.css';
@import './layouts/layout-ui.css';
@import './layouts/layout-utilities.css';
```

## Conventions de nommage

### Classes principales
- `.slidev-layout.{nom-layout}` - Conteneur principal du layout
- `.slidev-layout.{nom-layout} h1, h2, h3` - Styles des titres
- `.slidev-layout.{nom-layout} .{element}` - Éléments spécifiques

### Responsive
- Breakpoints : 640px (sm), 768px (md), 1024px (lg)
- Media queries à la fin de chaque fichier
- Classes responsive : `.sm\:`, `.md\:`, `.lg\:`

## Modification d'un layout

1. **Identifier le fichier** correspondant au layout à modifier
2. **Éditer le fichier CSS** spécifique
3. **Tester** avec `npm run dev:tribu-octo` ou `npm run dev:octo`
4. **Vérifier la responsivité** sur différentes tailles d'écran

## Ajout d'un nouveau layout

1. **Créer** un nouveau fichier `layout-{nom}.css`
2. **Ajouter** les styles du layout
3. **Importer** dans `../layout.css`
4. **Créer** le fichier Vue correspondant dans `../layouts/`
5. **Documenter** dans le README principal du thème

## Variables CSS disponibles

Toutes les variables OCTO sont disponibles dans chaque fichier :

```css
var(--octo-primary)      /* #FF6B35 */
var(--octo-secondary)    /* #2E3440 */
var(--octo-accent)       /* #88C0D0 */
var(--octo-background)   /* #ECEFF4 */
var(--octo-surface)      /* #FFFFFF */
var(--octo-text)         /* #2E3440 */
var(--octo-text-light)   /* #4C566A */
var(--octo-text-muted)   /* #81A1C1 */
var(--octo-success)      /* #A3BE8C */
var(--octo-warning)      /* #EBCB8B */
var(--octo-error)        /* #BF616A */
var(--octo-border)       /* #D8DEE9 */
var(--octo-border-light) /* #E5E9F0 */
var(--octo-shadow)       /* 0 4px 6px -1px rgba(46, 52, 64, 0.1) */
var(--octo-shadow-lg)    /* 0 10px 15px -3px rgba(46, 52, 64, 0.1) */
```

## Bonnes pratiques

- **Cohérence** : Utiliser les variables CSS OCTO
- **Responsive** : Inclure les media queries
- **Performance** : Éviter les sélecteurs trop complexes
- **Lisibilité** : Commenter les sections importantes
- **Maintenance** : Grouper les styles logiquement