#!/bin/bash
source .env
echo "🚀 Démarrage PocketBase pour $(basename $(pwd)) sur port $POCKETBASE_PORT"
./bdd/pocketbase serve \
  --http=$POCKETBASE_HOST:$POCKETBASE_PORT \
  --dir=./bdd/pb_data \
  --migrationsDir=./bdd/pb_migrations \
  --hooksDir=./bdd/pb_hooks