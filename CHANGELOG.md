# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Non publié] - 2025-10-02

### Ajouté
- Configuration de développement dynamique avec `dev.sh`
- Support multi-projets avec scripts de build séparés
- Configuration Nginx Proxy Manager pour deux domaines distincts
- Script `npm run dev <projet>` pour développement spécifique par projet

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