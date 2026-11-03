# Despliegue en servidor propio (Docker + HTTPS)

Pensado para un VPS Linux (Ubuntu 22.04/24.04, 1 vCPU / 1–2 GB RAM alcanza para empezar).
Todo corre con `docker compose`: la app (Next.js + API) y Caddy (HTTPS automático con Let's Encrypt).
La base de datos es un archivo SQLite y los archivos subidos viven en un volumen Docker (`appdata`).

## Antes de empezar
- Un dominio o subdominio (ej. `lavados.tudominio.com`) con un registro **A** apuntando a la IP del servidor.
- Puertos 80 y 443 abiertos en el firewall del servidor.
- Credenciales de Mercado Pago (de prueba primero).

## 0. Crear el servidor en Hetzner (Cloud)
1. **Llave SSH** (en tu computador): `ssh-keygen -t ed25519` y copia el contenido de `~/.ssh/id_ed25519.pub`.
2. En Hetzner Cloud: proyecto nuevo → *Add Server*:
   - **Imagen:** Ubuntu 24.04. **Tamaño:** mínimo 2 vCPU y **4 GB de RAM** (compilar la imagen con 2 GB suele quedarse sin memoria). Disco 40 GB para empezar.
   - **Ubicación:** para clientes en Colombia, Ashburn (EE. UU.) da menos latencia que Alemania/Finlandia; revisa que el tipo de servidor esté disponible allí y cuánto tráfico incluye.
   - **SSH key:** pega la pública. Activa **Backups** del servidor (copia diaria completa; es un extra de pago, y no reemplaza al script de abajo).
   - **Firewall (Hetzner):** entrada solo 22 (idealmente tu IP), 80 y 443.
3. **DNS:** en tu dominio crea un registro **A** `lavados.tudominio.com` → IP del servidor.
4. **Preparar el servidor:** `ssh root@IP`, clona el repo (si es privado, crea una *deploy key* de solo lectura en GitHub: `ssh-keygen -t ed25519` en el servidor y pega la pública en Settings → Deploy keys) y ejecuta `bash scripts/server-setup.sh` (Docker, firewall, fail2ban, actualizaciones automáticas, swap).
5. **Correo:** Hetzner **bloquea el envío por los puertos 25 y 465**; el 587 está abierto. Usa un SMTP externo con `SMTP_PORT=587` (Brevo, Amazon SES, Resend, Zoho, Google Workspace…).
6. Ejecuta `./scripts/preflight.sh` y, si todo está en verde, sigue con los pasos 2 a 6 de abajo.

> Docker publica los puertos por encima de `ufw`: por eso `docker-compose.yml` solo publica 80 y 443 (la app no se expone). No agregues `ports:` al servicio `app`.

**Disco:** las evidencias son fotos y videos de clientes; pueden crecer rápido (decenas de GB al año). Revisa `df -h` cada mes, agrega un *Volume* de Hetzner si hace falta y define cuánto tiempo las conservas.
**Copia fuera del servidor:** además de `./scripts/backup.sh`, sincroniza `backups/` a una *Storage Box* de Hetzner o a Object Storage (rsync/rclone por SSH) con otro cron. Una copia en el mismo disco no protege si el servidor se pierde.

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
Define `ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 12 caracteres): crean el **primer administrador** la primera vez que arranca. Después se gestiona todo desde el panel y esas variables ya no se usan (puedes borrarlas del `.env`).
**La app no arranca** si no existe ningún admin y la clave es débil, o si `APP_URL` no es https.

### Correo (necesario para recuperar contraseña y recordatorios)
Usa el SMTP de tu proveedor (Google Workspace, Zoho, Brevo, Resend, Amazon SES…) en `SMTP_*` y `MAIL_FROM`. Configura SPF/DKIM del dominio con ese proveedor para que los correos no caigan en spam. Prueba con «¿Olvidaste tu contraseña?» antes de activar `NOTIFY_ENABLED=true`.

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
Guarda la base de datos, el catálogo y las **evidencias de los clientes** en `backups/` (conserva 14 días). **Copia esa carpeta fuera del servidor** (otro servidor, S3/Backblaze, Google Drive con rclone). Un backup en el mismo disco no sirve si el disco falla.
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

## Costos aproximados (consultados en nov. 2026; verifica en cada sitio, cambian seguido)
| Pieza | Costo |
|---|---|
| Servidor Hetzner 2 vCPU / 4 GB / 80 GB (CPX22, Alemania o Finlandia) | ≈ 20 €/mes sin IVA |
| Alternativa en EE. UU. (Ashburn) 3 vCPU / 4 GB / 80 GB (CPX21) | ≈ 32,5 €/mes |
| Backups automáticos del servidor | desde 1,20 €/mes (depende del tamaño del servidor) |
| Storage Box de 1 TB para copias externas | 3,20 €/mes sin IVA |
| Volumen extra de disco | ≈ 0,05 €/GB/mes |
| Correo SMTP (Brevo, plan gratis: 300 correos/día) | 0 € |
| Certificado HTTPS (Let's Encrypt, automático con Caddy) | 0 € |
| Dominio | unos pocos dólares al mes prorrateados |
| Mercado Pago | comisión por pago exitoso (consulta tu tarifa en tu cuenta) |

## Ensayo antes de entregar (recomendado)
Hetzner cobra por horas: crea un servidor temporal, haz todo el despliegue y las pruebas de abajo, y bórralo (cuesta centavos). Luego repites en el definitivo.
1. `./scripts/preflight.sh` sin errores.  2. `docker compose up -d --build`.  3. Entrar a `/admin/ingresar`.
4. Crear lavada y producto con foto y video.  5. Agendar desde un **celular real** subiendo evidencias (un video grande).
6. Pagar con las credenciales de **prueba** de Mercado Pago (tarjeta, PSE) y ver que llegue el webhook.
7. Confirmar la cita y asignar empleado; ver que llegue el correo (y el de recuperar contraseña).
8. `./scripts/backup.sh`, **restaurar** esa copia en otro servidor y comprobar que todo aparece.
9. Reiniciar el servidor y comprobar que todo vuelve solo.

## Actualizar con seguridad
`./scripts/deploy.sh` hace copia, `git pull`, recompila, levanta y verifica la salud.

## Pendiente antes de entregar al cliente
- Pedidos de productos: falta el carrito del cliente y la sección «Pedidos» del panel (el catálogo ya se administra).
- Carrito de productos y pedidos.
- Aviso inmediato al empleado cuando se le asigna un servicio del mismo día (hoy solo recibe el resumen de la mañana).
- Verificación de correo del cliente y 2FA para el personal.
- Monitoreo externo de `/api/health` (UptimeRobot, etc.).
- Revisar términos, política de privacidad y tratamiento de datos personales (Colombia: Ley 1581).

## Alternativa: Vercel + Turso
Posible, pero requiere cambiar `DATABASE_URL` a Turso, activar Vercel Blob (`BLOB_READ_WRITE_TOKEN`) y el límite de subida es ~4.5 MB por archivo. Para el cliente final se recomienda el servidor propio descrito arriba.
