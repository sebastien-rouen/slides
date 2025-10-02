---
layout: cover
theme: ./themes/octo
highlighter: shiki
lineNumbers: false
info: |
  ## Exemple Thème OCTO
  Démonstration du thème OCTO pour Slidev
drawings:
  persist: false
transition: slide-left
title: Exemple Thème OCTO
fonts:
  sans: 'Outfit'
  serif: 'Outfit Light'
  mono: 'Fira Code'
  provider: 'google'
---

# Thème OCTO

## Démonstration des fonctionnalités

### Présentation par la Tribu Engagement

---
layout: cover
background: https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&h=1080&fit=crop
---

# Cover avec Background

## Image personnalisée

### Le layout cover supporte les images de fond

---
layout: cover-gradient
---

# Cover Gradient

## Gradient par défaut

### Sans image de fond

---
layout: intro
---

# Introduction

## Bienvenue dans le thème OCTO

Ce thème offre une expérience moderne et professionnelle pour vos présentations Slidev.

<div class="subtitle">
Conçu avec les couleurs et l'identité d'OCTO Technology
</div>

---
layout: section
---

# Section 1

Démonstration des layouts

---
layout: two-cols
---

::left::

## Fonctionnalités

- **Palette de couleurs OCTO**
- **Layouts variés**
- **Composants personnalisés**
- **Mode sombre/clair**
- **Responsive design**

<OctoBadge variant="primary">Nouveau</OctoBadge>
<OctoBadge variant="accent">Moderne</OctoBadge>

::right::

## Composants

<OctoCard elevated>
  <template #header>
    <h3>Carte exemple</h3>
  </template>
  
  Cette carte démontre l'utilisation des composants personnalisés du thème OCTO.
  
  <template #footer>
    <OctoBadge variant="success" size="sm">Succès</OctoBadge>
  </template>
</OctoCard>

<div class="mt-4">
  <OctoLogo :size="60" />
</div>

---
layout: center
---

# Layout Centré

## Parfait pour les messages importants

Ce layout centre automatiquement le contenu et met l'accent sur les éléments clés de votre présentation.

<OctoBadge variant="warning" size="lg">Important</OctoBadge>

---

# Slide Standard

## Avec du code

Voici un exemple de code avec la coloration syntaxique :

```typescript
// Exemple TypeScript
interface OctoTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const theme: OctoTheme = {
  name: 'OCTO',
  colors: {
    primary: '#FF6B35',
    secondary: '#2E3440',
    accent: '#88C0D0'
  }
};
```

---

# Éléments de contenu

## Listes et texte

- **Point important** avec mise en forme
- Point normal avec du texte
- Point avec `code inline`

> Citation importante pour illustrer un concept clé

| Fonctionnalité | Status | Description |
|----------------|--------|-------------|
| Layouts | ✅ | 7 layouts disponibles |
| Composants | ✅ | 3 composants personnalisés |
| Thème sombre | ✅ | Support complet |
| Responsive | ✅ | Optimisé mobile |

---
layout: end
---

# Merci !

## Questions ?

Découvrez plus sur OCTO Technology

<div class="mt-8">
  <OctoLogo :size="80" />
</div>