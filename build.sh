#!/bin/bash
set -e

# Fonction pour copier tous les assets
copy_all_assets() {
  local pres="$1"
  local source_dir="pages/$pres/assets"
  local dest_dir="dist/$pres/assets"
  
  if [ -d "$source_dir" ]; then
    echo "📁 Copie de tous les assets pour $pres"
    mkdir -p "$dest_dir"
    cp -r "$source_dir"/* "$dest_dir/" 2>/dev/null || true
    echo "  ✅ Tous les assets copiés"
  fi
}

# Si un paramètre est fourni, ne traiter que ce projet
if [ $# -eq 1 ]; then
  pres="$1"
  dir="pages/$pres"
  if [ -d "$dir" ] && [ -f "$dir/main.md" ]; then
    echo "📦 Build $pres"
    npx @slidev/cli build "$dir/main.md" --out="../../dist/$pres" --base "/$pres/"
    copy_all_assets "$pres"
    echo "✅ Présentation $pres prête dans dist/"
  else
    echo "❌ Erreur: Le projet '$pres' n'existe pas ou n'a pas de fichier main.md"
    exit 1
  fi
else
  rm -rf dist
  # Traiter tous les projets
  for dir in pages/*; do
    pres=$(basename "$dir")
    if [ -f "$dir/main.md" ]; then
      echo "📦 Build $pres"
      npx @slidev/cli build "$dir/main.md" --out="../../dist/$pres" --base "/$pres/"
      copy_all_assets "$pres"
    fi
  done
  
  # Copier la page d'accueil
  echo "🏠 Copie de la page d'accueil..."
  cp index.html dist/
  
  echo "✅ Toutes les présentations sont prêtes dans dist/"
fi
