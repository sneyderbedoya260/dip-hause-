#!/usr/bin/env bash
# Actualiza la aplicación: copia de seguridad → git pull → compilar → levantar → verificar salud.
# Uso (en el servidor, dentro de la carpeta del proyecto):  ./scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
./scripts/backup.sh || echo "(aviso) no se hizo copia: normal en el primer despliegue"
git pull --ff-only
docker compose up -d --build
echo "Esperando a que la aplicación responda..."
for i in $(seq 1 40); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "✔ Aplicación saludable"; docker image prune -f >/dev/null; exit 0
  fi
  sleep 3
done
echo "✘ La aplicación no respondió. Revisa:  docker compose logs --tail=100 app"; exit 1
