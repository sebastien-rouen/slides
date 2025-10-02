# Présentation Tribu Engagement - Thème OCTO

Cette présentation utilise le thème OCTO personnalisé et est organisée en slides séparés pour une meilleure maintenance.

## Structure des fichiers

### Fichier principal
- `main-octo.md` - Fichier principal qui importe tous les slides

### Slides individuels
1. `01-cover.md` - Page de couverture avec titre et date
2. `02-qui-sommes-nous.md` - Introduction de la Tribu Engagement
3. `03-nos-expertises.md` - Section d'introduction aux expertises
4. `04-competences.md` - Détail des compétences (mindmapping, facilitation)
5. `05-nos-methodes.md` - Méthodes utilisées (Design Thinking, Lean, etc.)
6. `06-processus.md` - Processus d'engagement en 4 étapes
7. `07-outils-formations.md` - Outils et catalogue de formations
8. `08-témoignages.md` - Témoignages clients
9. `09-références.md` - Logos des clients de référence
10. `10-merci.md` - Page de fin avec contact

## Layouts utilisés

- **Cover** : Page de titre avec gradient et informations de date
- **Intro** : Page d'introduction avec mise en valeur
- **Section** : Séparateurs de section avec fond coloré
- **Two-cols** : Contenu en deux colonnes
- **Center** : Contenu centré
- **End** : Page de fin avec contact

## Composants OCTO utilisés

- `<OctoLogo>` : Logo OCTO personnalisé
- `<OctoBadge>` : Badges colorés avec variants
- `<OctoCard>` : Cartes avec header/footer optionnels

## Développement

Pour lancer la présentation en mode développement :

```bash
npm run dev:tribu-octo
```

La présentation sera accessible sur `http://localhost:3034`

## Personnalisation

Chaque slide peut être modifié indépendamment. Les layouts et composants sont définis dans le thème OCTO (`../../themes/octo/`).

### Modification d'un slide

1. Ouvrir le fichier `.md` correspondant
2. Modifier le contenu
3. Le hot-reload mettra à jour automatiquement la présentation

### Ajout d'un nouveau slide

1. Créer un nouveau fichier `XX-nom-du-slide.md`
2. Ajouter la référence dans `main-octo.md` :
   ```markdown
   ---
   src: ./XX-nom-du-slide.md
   ---
   ```

## Export

Pour exporter la présentation :

```bash
npx @slidev/cli export pages/tribu/main-octo.md --format pdf
npx @slidev/cli export pages/tribu/main-octo.md --format png
npx @slidev/cli export pages/tribu/main-octo.md --format pptx
```