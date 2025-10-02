# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non publié] - 2025-10-02

### Ajouté
- **Thème OCTO personnalisé** : Nouveau thème Slidev basé sur l'identité visuelle OCTO Technology
  - Palette de couleurs OCTO (Orange #FF6B35, Gris #2E3440, Bleu #88C0D0)
  - 7 layouts disponibles : cover, intro, section, two-cols, center, end, default
  - 3 composants personnalisés : OctoLogo, OctoBadge, OctoCard
  - Support mode sombre/clair complet
  - Classes utilitaires étendues (couleurs, espacement, flexbox, etc.)
  - Typographie Outfit + Fira Code
  - Animations et transitions fluides
- Configuration de développement dynamique avec `dev.sh`
- Support multi-projets avec scripts de build séparés
- Configuration Nginx Proxy Manager pour deux domaines distincts
- Script `npm run dev <projet>` pour développement spécifique par projet
- Exemple d'utilisation du thème OCTO pour la présentation Tribu (`main-octo.md`)
- **Structure modulaire des slides** : Séparation de `main-octo.md` en 10 fichiers individuels
  - `01-cover.md` à `10-merci.md` pour une meilleure organisation
  - Utilisation de `src: ./XX-nom.md` pour l'import des slides
  - Documentation complète dans `README-octo.md`
- **Amélioration du layout Cover** : Support intégré des images de fond
  - Background automatiquement géré par le layout cover
  - Nouveau layout `cover-gradient` pour gradient uniquement
  - Overlay automatique pour améliorer la lisibilité du texte
  - Date et informations d'entreprise intégrées au layout
- **Réorganisation des styles CSS** : Séparation des layouts en fichiers spécifiques
  - `styles/layouts/` : Dossier contenant tous les layouts séparés
  - `layout-default.css`, `layout-cover.css`, `layout-intro.css`, etc.
  - `layout-ui.css` pour l'interface Slidev
  - `layout-utilities.css` pour les classes utilitaires
  - Import centralisé dans `layout.css` principal
  - Documentation complète dans `styles/layouts/README.md`
- **Réorganisation complète des styles CSS** : Séparation logique en fichiers spécialisés
  - `index.css` : Variables CSS et imports centralisés
  - `base.css` : Styles de base et typographie (h1, h2, h3, etc.)
  - `components.css` : Composants réutilisables (boutons, cartes, badges)
  - `utilities.css` : Classes utilitaires générales (couleurs, espacement, flexbox)
  - `layout.css` : Import des layouts spécifiques
  - Variables CSS étendues (typographie, espacements, rayons, transitions)
  - Correction de la couleur primaire (retour à l'orange OCTO #FF6B35)
  - Documentation complète dans `styles/README.md`
- **Élimination des doublons CSS** : Refactorisation complète des utilitaires
  - Séparation claire entre `utilities.css` (général) et `layout-utilities.css` (spécifique layouts)
  - Suppression des doublons (overflow, positionnement, z-index, hauteurs)
  - Organisation par sections avec commentaires clairs
  - Documentation de la séparation dans le README

### Modifié
- Architecture de développement séparée de la production
- Configuration des domaines : `drafts.slides-dev.bastou.dev` (dev) et `drafts.slides.bastou.dev` (prod)
- Scripts de build optimisés avec copie automatique des assets
- Configuration Vite améliorée pour la gestion des images

### Corrigé
- Problème d'images manquantes après le build (tiger.jpg, bilan.jpg, lego-gandalf.jpg, etc.)
- Copie automatique de tous les assets lors du build
- Configuration des chemins relatifs pour les builds

## [1.0.0] - 2025-09-30

### Ajouté
- Projet initial basé sur Slidev
- Architecture multi-présentations (bastaverse, tribu)
- Configuration PM2 pour la gestion des processus
- Scripts de build séparés par présentation
- Configuration Nginx Proxy Manager
- Support des thèmes Slidev (seriph, default, bricks)
- Composants Vue personnalisés
- Configuration TypeScript
- Variables d'environnement pour le développement

### Structure
- `pages/` : Présentations organisées par sujet
- `dist/` : Builds de production générés
- `components/` : Composants Vue réutilisables
- `snippets/` : Extraits de code pour les présentations

### Présentations
- **BastaVerse** : Présentation de l'écosystème et architecture
- **Tribu** : Présentation dédiée à l'équipe

### Configuration
- Support hot-reload en développement
- Export PDF, PNG, PPTX
- Intégration Mermaid pour les diagrammes
- Support KaTeX pour les formules mathématiques
- Iconify pour les icônes (100k+ disponibles)