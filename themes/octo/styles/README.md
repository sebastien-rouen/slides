# Organisation des Styles du Thème OCTO

Cette documentation explique l'organisation complète des fichiers CSS du thème OCTO pour Slidev.

## Structure des fichiers

```
themes/octo/styles/
├── index.css              # Fichier principal avec variables CSS et imports
├── base.css               # Styles de base (typographie, éléments HTML)
├── components.css         # Composants (boutons, cartes, badges, alertes)
├── utilities.css          # Utilitaires généraux (couleurs, espacement, flexbox)
├── layout.css             # Import des layouts (pointe vers layouts/*)
└── layouts/               # Dossier des layouts séparés
    ├── README.md          # Documentation des layouts
    ├── layout-default.css
    ├── layout-cover.css
    ├── layout-intro.css
    ├── layout-section.css
    ├── layout-two-cols.css
    ├── layout-center.css
    ├── layout-end.css
    ├── layout-special.css
    ├── layout-ui.css
    └── layout-utilities.css
```

## Ordre d'import

Les fichiers sont importés dans cet ordre dans `index.css` :

1. **Variables CSS** (dans index.css)
2. **base.css** - Styles de base et typographie
3. **components.css** - Composants réutilisables
4. **utilities.css** - Classes utilitaires
5. **layout.css** - Layouts spécifiques

## Variables CSS disponibles

### Couleurs
```css
--octo-primary: #FF6B35;      /* Orange OCTO */
--octo-secondary: #2E3440;    /* Gris foncé */
--octo-accent: #88C0D0;       /* Bleu clair */
--octo-background: #ECEFF4;   /* Gris très clair */
--octo-surface: #FFFFFF;      /* Blanc */
--octo-text: #2E3440;         /* Texte principal */
--octo-text-light: #4C566A;   /* Texte secondaire */
--octo-text-muted: #81A1C1;   /* Texte atténué */
--octo-success: #A3BE8C;
--octo-warning: #EBCB8B;
--octo-error: #BF616A;
--octo-info: var(--octo-accent);
```

### Ombres et bordures
```css
--octo-shadow: 0 4px 6px -1px rgba(46, 52, 64, 0.1);
--octo-shadow-lg: 0 10px 15px -3px rgba(46, 52, 64, 0.1);
--octo-border: #D8DEE9;
--octo-border-light: #E5E9F0;
```

### Typographie
```css
--octo-font-sans: 'Outfit', sans-serif;
--octo-font-serif: 'Outfit Light', serif;
--octo-font-mono: 'Fira Code', monospace;
```

### Espacements
```css
--octo-spacing-xs: 0.25rem;
--octo-spacing-sm: 0.5rem;
--octo-spacing-md: 1rem;
--octo-spacing-lg: 1.5rem;
--octo-spacing-xl: 2rem;
```

### Rayons de bordure
```css
--octo-radius-sm: 0.25rem;
--octo-radius-md: 0.375rem;
--octo-radius-lg: 0.5rem;
--octo-radius-xl: 0.75rem;
--octo-radius-full: 9999px;
```

### Transitions
```css
--octo-transition-fast: 0.15s ease;
--octo-transition-base: 0.2s ease;
--octo-transition-slow: 0.3s ease;
```

## Séparation des utilitaires

Le thème OCTO utilise **deux fichiers d'utilitaires** pour éviter les doublons et maintenir une organisation claire :

1. **`utilities.css`** : Utilitaires généraux réutilisables partout
   - Animations, couleurs, espacement, flexbox, grille, texte, etc.
   - Classes standard type Tailwind CSS

2. **`layouts/layout-utilities.css`** : Utilitaires spécifiques aux présentations
   - Positionnement absolu pour les slides
   - Overlays et backgrounds avec transparence
   - Classes responsive pour les layouts
   - Animations Vue pour les transitions de slides

Cette séparation permet :
- ✅ Pas de doublons entre les fichiers
- ✅ Organisation logique (général vs spécifique)
- ✅ Maintenance facilitée
- ✅ Chargement optimisé

## Fichiers détaillés

### `index.css`
- **Rôle** : Point d'entrée principal
- **Contenu** : Variables CSS et imports
- **Usage** : Importé automatiquement par Slidev

### `base.css`
- **Rôle** : Styles de base pour tous les éléments HTML
- **Contenu** : 
  - Typographie (h1-h6, p, a, strong, em)
  - Code et préformatage
  - Listes (ul, ol, li)
  - Citations (blockquote)
  - Tableaux
  - Images
  - Scrollbar personnalisée
  - Mode sombre

### `components.css`
- **Rôle** : Composants réutilisables
- **Contenu** :
  - Boutons (.btn avec variantes)
  - Cartes (.card avec header/footer)
  - Badges (.badge avec couleurs)
  - Alertes (.alert)
  - Conteneurs (.container)
  - Séparateurs (.divider)
  - Tooltips (.tooltip)

### `utilities.css`
- **Rôle** : Classes utilitaires générales (sans doublons avec layout-utilities.css)
- **Contenu** :
  - Animations (fade-in, slide-in, bounce-in, pulse)
  - Couleurs (text-*, bg-*)
  - Espacement (m-*, p-*, space-*)
  - Flexbox (flex, items-*, justify-*)
  - Grille (grid, grid-cols-*)
  - Taille (w-*, h-*, max-w-*, min-*)
  - Texte (text-*, font-*)
  - Opacité (opacity-*)
  - Bordures (border-*, rounded-*)
  - Ombres (shadow-*)
  - Visibilité (visible, hidden)
  - Curseur (cursor-*)
  - Sélection (select-*)

### `layouts/layout-utilities.css`
- **Rôle** : Utilitaires spécifiques aux layouts et présentations
- **Contenu** :
  - Background blend modes (bg-blend-*)
  - Overlays avec transparence (bg-black/*, bg-white/*)
  - Positionnement absolu/relatif/fixe
  - Positionnement précis (top-*, bottom-*, left-*, right-*)
  - Z-index pour les layouts
  - Overlays personnalisés (.overlay-*)
  - Conteneurs de contenu (.content-*)
  - Animations Vue (slide-enter-*, fade-*)
  - Débordement (overflow-*)
  - Hauteurs spécifiques (h-screen, min-h-screen)
  - Classes responsive (sm:*, md:*, lg:*)

### `layout.css`
- **Rôle** : Import centralisé des layouts
- **Contenu** : Imports vers `layouts/*.css`

## Mode sombre

Le thème supporte automatiquement le mode sombre via la classe `.dark` :

```css
.dark {
  --octo-background: #2E3440;
  --octo-surface: #3B4252;
  --octo-text: #ECEFF4;
  /* ... autres variables */
}
```

## Utilisation

### Dans un layout Vue
```vue
<template>
  <div class="slidev-layout my-layout">
    <h1>Titre avec couleur primaire</h1>
    <div class="card elevated">
      <p class="text-muted">Texte atténué</p>
    </div>
  </div>
</template>

<style scoped>
.my-layout {
  background: var(--octo-background);
  padding: var(--octo-spacing-xl);
}
</style>
```

### Dans un slide Markdown
```markdown
---
layout: center
---

# Titre Principal

<div class="card p-6 shadow-lg">
  <h3 class="text-primary mb-4">Sous-titre</h3>
  <p class="text-light">Contenu de la carte</p>
</div>

<div class="flex space-x-4 mt-8">
  <div class="badge primary">Important</div>
  <div class="badge success">Succès</div>
</div>
```

## Personnalisation

### Modifier les couleurs
Éditez les variables dans `index.css` :

```css
:root {
  --octo-primary: #YOUR_COLOR;
  --octo-secondary: #YOUR_COLOR;
  /* ... */
}
```

### Ajouter des utilitaires
Ajoutez vos classes dans `utilities.css` :

```css
.my-utility {
  /* vos styles */
}
```

### Créer un nouveau composant
Ajoutez dans `components.css` :

```css
.my-component {
  background: var(--octo-surface);
  border: 1px solid var(--octo-border);
  /* ... */
}
```

## Bonnes pratiques

1. **Utiliser les variables CSS** plutôt que des valeurs en dur
2. **Respecter l'ordre d'import** pour éviter les conflits
3. **Préfixer les classes custom** pour éviter les collisions
4. **Tester en mode sombre** pour s'assurer de la compatibilité
5. **Documenter les nouveaux composants** dans ce README

## Maintenance

- **Variables** : Modifier dans `index.css`
- **Typographie** : Modifier dans `base.css`
- **Composants** : Modifier dans `components.css`
- **Utilitaires** : Modifier dans `utilities.css`
- **Layouts** : Modifier dans `layouts/layout-*.css`

Cette organisation permet une maintenance facile et une évolutivité du thème OCTO.