#!/bin/bash
set -e

# Vérifier qu'un projet est fourni
if [ $# -ne 1 ]; then
  echo "❌ Erreur: Vous devez spécifier un projet"
  echo "Usage: ./dev.sh <projet>"
  echo "Projets disponibles:"
  for dir in pages/*; do
    pres=$(basename "$dir")
    if [ -f "$dir/main.md" ]; then
      echo "  - $pres"
    fi
  done
  exit 1
fi

pres="$1"
dir="pages/$pres"

# Vérifier que le projet existe
if [ ! -d "$dir" ] || [ ! -f "$dir/main.md" ]; then
  echo "❌ Erreur: Le projet '$pres' n'existe pas ou n'a pas de fichier main.md"
  exit 1
fi

echo "🚀 Démarrage du serveur de développement pour $pres"
echo "📍 Accessible via: https://drafts.slides-dev.bastou.dev/"
echo "🔄 Hot-reload activé - les modifications seront visibles en temps réel"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"

# Démarrer Slidev en mode développement
npx @slidev/cli "$dir/main.md" --remote --port=3032
