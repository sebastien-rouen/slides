# Thème OCTO pour Slidev

Un thème moderne et professionnel pour Slidev, inspiré de l'identité visuelle d'OCTO Technology.

## Caractéristiques

- **Palette de couleurs OCTO** : Orange principal (#FF6B35), gris foncé (#2E3440), bleu accent (#88C0D0)
- **Typographie moderne** : Outfit pour le texte, Fira Code pour le code
- **Layouts variés** : Cover, intro, section, two-cols, center, end
- **Composants personnalisés** : Logo, badges, cartes
- **Mode sombre/clair** : Support complet des deux modes
- **Responsive** : Optimisé pour différentes tailles d'écran

## Installation

1. Copiez le dossier `themes/octo` dans votre projet Slidev
2. Dans votre fichier de présentation, utilisez :

```yaml
---
theme: ./themes/octo
---
```

## Layouts disponibles

### Cover (Couverture)
```yaml
---
layout: cover
background: assets/image.png  # Optionnel
---
```
Layout pour la page de titre avec support d'image de fond ou gradient par défaut. Inclut automatiquement la date et les informations d'entreprise.

### Cover Gradient (Couverture avec gradient)
```yaml
---
layout: cover-gradient
---
```
Layout pour la page de titre avec gradient OCTO uniquement (sans support d'image de fond).

### Intro (Introduction)
```yaml
---
layout: intro
---
```
Layout pour les pages d'introduction avec mise en valeur du titre.

### Section
```yaml
---
layout: section
---
```
Layout pour les séparateurs de section avec fond dégradé.

### Two-cols (Deux colonnes)
```yaml
---
layout: two-cols
---

::left::
Contenu de gauche

::right::
Contenu de droite
```

### Center (Centré)
```yaml
---
layout: center
---
```
Layout centré pour les contenus importants.

### End (Fin)
```yaml
---
layout: end
---
```
Layout pour la page de fin avec informations de contact.

## Composants

### OctoLogo
```vue
<OctoLogo :size="80" :isDark="false" />
```

### OctoBadge
```vue
<OctoBadge variant="primary" size="md">Badge</OctoBadge>
```

Variants disponibles : `primary`, `secondary`, `accent`, `success`, `warning`, `error`
Tailles disponibles : `sm`, `md`, `lg`

### OctoCard
```vue
<OctoCard :elevated="true" :bordered="true">
  <template #header>
    <h3>Titre de la carte</h3>
  </template>
  
  Contenu de la carte
  
  <template #footer>
    Pied de page
  </template>
</OctoCard>
```

## Classes utilitaires

Le thème inclut de nombreuses classes utilitaires pour :
- Couleurs : `.text-primary`, `.bg-accent`, etc.
- Espacement : `.mb-4`, `.p-6`, etc.
- Flexbox : `.flex`, `.items-center`, etc.
- Positionnement : `.absolute`, `.bottom-10`, etc.
- Texte : `.text-center`, `.font-bold`, etc.
- Bordures : `.rounded-lg`, `.border`, etc.

## Variables CSS personnalisables

```css
:root {
  --octo-primary: #FF6B35;      /* Orange OCTO */
  --octo-secondary: #2E3440;    /* Gris foncé */
  --octo-accent: #88C0D0;       /* Bleu clair */
  --octo-background: #ECEFF4;   /* Gris très clair */
  --octo-surface: #FFFFFF;      /* Blanc */
  --octo-text: #2E3440;         /* Texte principal */
  /* ... autres variables */
}
```

## Exemple d'utilisation

```markdown
---
theme: ./themes/octo
background: assets/template/slide-01-intro.png
class: bg-blend-overlay bg-black/15
highlighter: shiki
lineNumbers: false
fonts:
  sans: 'Outfit'
  serif: 'Outfit Light'
  mono: 'Fira Code'
  provider: 'google'
---

# Ma Présentation OCTO

Sous-titre de la présentation

---
layout: section
---

# Section 1

Introduction à la section

---
layout: two-cols
---

::left::

## Contenu de gauche

- Point 1
- Point 2
- Point 3

::right::

## Contenu de droite

<OctoCard elevated>
  Contenu dans une carte
</OctoCard>

---
layout: end
---

# Merci !

Questions ?
```

## Personnalisation

Vous pouvez personnaliser le thème en :
1. Modifiant les variables CSS dans `styles/index.css`
2. Ajoutant vos propres layouts dans `layouts/`
3. Créant de nouveaux composants dans `components/`
4. Adaptant les couleurs selon votre charte graphique

## Licence

MIT License - Libre d'utilisation et de modification.