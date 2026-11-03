#!/usr/bin/env bash
# Copia de seguridad: base de datos (consistente, con VACUUM INTO) + archivos subidos.
# Uso en el servidor, dentro de la carpeta del proyecto:  ./scripts/backup.sh
# Programar a diario (crontab -e):  0 3 * * * cd /opt/dip-house && ./scripts/backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
STAMP=$(date +%Y%m%d-%H%M%S)
mkdir -p backups
docker compose exec -T app node -e "
const {createClient}=require('@libsql/client');
createClient({url:process.env.DATABASE_URL}).execute(\"VACUUM INTO '/data/backups/app-$STAMP.db'\").then(()=>console.log('db ok'));
"
docker compose cp "app:/data/backups/app-$STAMP.db" "backups/app-$STAMP.db"
docker compose exec -T app rm -f "/data/backups/app-$STAMP.db"
docker compose exec -T app tar -czf - -C /data uploads evidence > "backups/uploads-$STAMP.tar.gz"
find backups -name 'app-*.db' -mtime +14 -delete
find backups -name 'uploads-*.tar.gz' -mtime +14 -delete
echo "Backup $STAMP listo"
