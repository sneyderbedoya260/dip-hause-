# Despliegue en servidor propio (Docker + HTTPS)

Pensado para un VPS Linux (Ubuntu 22.04/24.04, 1 vCPU / 1–2 GB RAM alcanza para empezar).
Todo corre con `docker compose`: la app (Next.js + API) y Caddy (HTTPS automático con Let's Encrypt).
La base de datos es un archivo SQLite y los archivos subidos viven en un volumen Docker (`appdata`).

## Antes de empezar
- Un dominio o subdominio (ej. `lavados.tudominio.com`) con un registro **A** apuntando a la IP del servidor.
- Puertos 80 y 443 abiertos en el firewall del servidor.
- Credenciales de Mercado Pago (de prueba primero).

## 1. Preparar el servidor
```bash
curl -fsSL https://get.docker.com | sh          # instala Docker + compose
sudo usermod -aG docker $USER && newgrp docker
sudo mkdir -p /opt/dip-house && sudo chown $USER /opt/dip-house
git clone git@github.com:TU_USUARIO/dip-house.git /opt/dip-house
cd /opt/dip-house
```

## 2. Configurar
```bash
cp .env.production.example .env
nano .env
```
Genera valores seguros: `openssl rand -base64 48` (para `JWT_SECRET`) y una contraseña larga para `ADMIN_PASSWORD`.
**La app no arranca** si la contraseña es débil, si `JWT_SECRET` tiene menos de 32 caracteres o si `APP_URL` no es https.

## 3. Levantar
```bash
docker compose up -d --build
docker compose logs -f app        # debe decir: [dip-house] base lista
```
Al arrancar, la app aplica sola las migraciones de la base (nunca borran datos). Abre `https://TU_DOMINIO` y `https://TU_DOMINIO/api/health`.

## 4. Mercado Pago
1. En el panel de desarrolladores de Mercado Pago, crea la aplicación y copia el **Access Token** a `MP_ACCESS_TOKEN`.
2. Webhook: `https://TU_DOMINIO/api/v1/payments/webhook` (evento *Pagos*). Copia la **clave secreta** del webhook a `MP_WEBHOOK_SECRET`.
3. `docker compose up -d` para recargar el `.env`.
4. Haz una compra de prueba completa antes de pasar a credenciales de producción.

## 5. Copias de seguridad (obligatorio antes de entregar)
```bash
./scripts/backup.sh                                   # prueba manual
crontab -e   →   0 3 * * * cd /opt/dip-house && ./scripts/backup.sh >> backups/backup.log 2>&1
```
Guarda base de datos y archivos en `backups/` (conserva 14 días). **Copia esa carpeta fuera del servidor** (otro servidor, S3/Backblaze, Google Drive con rclone). Un backup en el mismo disco no sirve si el disco falla.
Restaurar: detén la app, copia el `.db` a `/data/app.db` dentro del volumen y vuelve a levantar.

## 6. Actualizar a una versión nueva
```bash
cd /opt/dip-house && git pull && docker compose up -d --build
```
Antes de actualizar, ejecuta `./scripts/backup.sh`.

## Cambios en la base de datos (para desarrollo)
1. Edita `apps/web/src/db/schema.ts`.
2. `npm run db:generate` crea un archivo en `apps/web/drizzle/`. Súbelo a git.
3. Al desplegar, la app lo aplica sola.

## Pendiente antes de entregar al cliente
- Panel de administración con pantallas (hoy el admin opera por la API).
- Carrito de productos y pedidos.
- Notificaciones (correo/WhatsApp) al recibir y confirmar citas.
- Monitoreo externo de `/api/health` (UptimeRobot, etc.).
- Revisar términos, política de privacidad y tratamiento de datos personales (Colombia: Ley 1581).

## Alternativa: Vercel + Turso
Posible, pero requiere cambiar `DATABASE_URL` a Turso, activar Vercel Blob (`BLOB_READ_WRITE_TOKEN`) y el límite de subida es ~4.5 MB por archivo. Para el cliente final se recomienda el servidor propio descrito arriba.
