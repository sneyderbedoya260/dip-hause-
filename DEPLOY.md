# Despliegue en Hetzner (Docker + HTTPS)

**Idea:** GitHub compila la imagen (gratis) → el servidor solo la descarga y la ejecuta. Por eso un servidor de **2 GB de RAM** alcanza (la app usa ~200 MB, tope 768 MB). Todo corre con `docker compose`: la app (Next.js + API) y Caddy (HTTPS automático con Let's Encrypt). Los datos viven en un volumen Docker (`appdata`): base SQLite, catálogo, evidencias y copias.

## Costos aproximados (consultados nov. 2026; verifica en cada sitio, cambian seguido)
| Pieza | Costo |
|---|---|
| Servidor Hetzner de 2 GB RAM (línea CPX12) | ≈ 12 €/mes sin IVA |
| Servidor más holgado, 4 GB (CPX22, Alemania/Finlandia) | ≈ 20 €/mes |
| Backups automáticos del servidor | desde 1,20 €/mes (según tamaño) |
| Storage Box 1 TB (copias externas) | 3,20 €/mes sin IVA |
| Volumen extra de disco (evidencias) | ≈ 0,05 €/GB/mes |
| Correo SMTP (Brevo gratis: 300/día) | 0 € |
| HTTPS (Let's Encrypt, automático) · GitHub (repo + compilación) | 0 € |
| Dominio | unos pocos dólares al mes prorrateados |
| Mercado Pago | comisión por pago exitoso (confirma tu tarifa) |

## 1. Preparar cuentas
GitHub (repositorio **privado**), Hetzner Cloud, dominio, SMTP (Brevo/SES/Resend…), Mercado Pago como vendedor.

## 2. Publicar la imagen
1. Sube el proyecto a GitHub (`git push`). El flujo `.github/workflows/release.yml` compila y publica `ghcr.io/TU_USUARIO/dip-house:latest` (pestaña *Actions*; la primera vez tarda unos minutos).
2. En GitHub → *Settings → Developer settings → Personal access tokens (classic)* crea uno con permiso **read:packages** (para que el servidor pueda descargar la imagen privada).

## 3. Crear el servidor en Hetzner
1. `ssh-keygen -t ed25519` en tu computador; copia la pública.
2. Hetzner Cloud → *Add Server*: Ubuntu 24.04 · **2 GB de RAM o más** · ubicación (para Colombia, Ashburn da menos latencia que Europa, si el plan está disponible) · tu SSH key · **Backups** activados.
3. **Firewall de Hetzner:** entrada solo 22 (idealmente tu IP), 80 y 443.
4. **DNS:** registro **A** `lavados.tudominio.com` → IP del servidor.
5. `ssh root@IP`, clona el repo (con una *deploy key* de solo lectura en GitHub) y ejecuta `bash scripts/server-setup.sh` (Docker, firewall, fail2ban, actualizaciones automáticas, swap).
6. Inicia sesión en el registro de imágenes: `echo TU_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin`.
> Hetzner **bloquea el correo saliente por los puertos 25 y 465**; usa un SMTP por el **587**. Docker publica puertos por encima de `ufw`: `docker-compose.yml` solo publica 80 y 443; no agregues `ports:` a `app`.

## 4. Configurar
```bash
cp .env.production.example .env && nano .env
```
- `DATA_KEY`: `openssl rand -base64 48`. **Guárdala aparte**: sin ella no se pueden leer los secretos de 2FA.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` (12+ caracteres): crean el primer administrador solo la primera vez.
- Datos del negocio (`BUSINESS_*`) para la política de privacidad; SMTP; `APP_IMAGE`.
- Ejecuta `./scripts/preflight.sh`: revisa memoria, disco, DNS, correo y configuración. Corrige todo lo que marque ✘.

## 5. Levantar
```bash
docker compose pull app && docker compose up -d
docker compose logs -f app        # debe decir: [dip-house] base lista
```
La app aplica sola las migraciones (nunca borran datos). Abre `https://TU_DOMINIO` y `/api/health`.
**Primer ingreso del administrador:** `/admin/ingresar` → te llevará a `/admin/seguridad` para activar la verificación en dos pasos (app autenticadora) y guardar los 8 códigos de respaldo. Después invita a los empleados desde *Personal*; ellos también deberán activarla.

## 6. Mercado Pago
1. Access Token → `MP_ACCESS_TOKEN`. Webhook: `https://TU_DOMINIO/api/v1/payments/webhook` (evento *Pagos*); su clave secreta → `MP_WEBHOOK_SECRET`. `docker compose up -d`.
2. Prueba una compra completa con credenciales de **prueba** antes de pasar a producción.

## 7. Copias de seguridad (obligatorio antes de entregar)
```bash
./scripts/backup.sh               # base (consistente), catálogo y evidencias → backups/
crontab -e   →   0 3 * * * cd /opt/dip-house && ./scripts/backup.sh >> backups/backup.log 2>&1
```
Conserva 14 días. **Copia `backups/` fuera del servidor** (Storage Box de Hetzner por rsync/rclone). Restaurar: detén la app, copia el `.db` a `/data/app.db` dentro del volumen y vuelve a levantar. **Prueba la restauración una vez.**

## 8. Actualizar
Haz `git push`: GitHub compila la imagen nueva. En el servidor: `./scripts/deploy.sh` (copia → descarga → reinicia → verifica salud).
**Volver atrás:** en `.env` pon `APP_IMAGE=ghcr.io/TU_USUARIO/dip-house:sha-XXXXXXX` (una versión anterior, visible en GitHub → Packages) y `docker compose up -d`.

## Ensayo antes de entregar (recomendado)
Hetzner cobra por horas: crea un servidor temporal, haz todo y bórralo (centavos).
1. `preflight.sh` sin errores · 2. levantar · 3. entrar como admin y **activar 2FA** · 4. crear lavada y producto con foto y video · 5. agendar desde un **celular real** subiendo evidencias (un video grande) · 6. pagar con credenciales de prueba (tarjeta, PSE) y ver el webhook · 7. confirmar la cita, asignar empleado, ver que llegue el correo (y el de recuperar contraseña y el de verificación) · 8. hacer un pedido con el carrito · 9. revisar **Reportes**: que el dinero coincida; descargar Excel y PDF · 10. `backup.sh`, **restaurar** en otro servidor · 11. reiniciar el servidor y comprobar que todo vuelve solo.

## Cambios en la base de datos (para desarrollo)
Edita `apps/web/src/db/schema.ts` → `npm run db:generate` crea un archivo en `apps/web/drizzle/` (súbelo a git) → al desplegar se aplica solo.

## Mantenimiento y vigilancia
- Monitor externo gratuito (UptimeRobot, etc.) sobre `https://TU_DOMINIO/api/health`.
- Cada mes: `df -h` (las evidencias crecen), revisar logs (`docker compose logs --tail=200 app`) y probar una restauración.
- La **retención de evidencias** (Ajustes → días) borra solas las de citas cerradas; debe coincidir con tu política de privacidad.

## Antes de entregar al cliente
- **Textos legales:** completa `BUSINESS_*` y haz que un abogado revise la política de privacidad y los términos (Ley 1581 de 2012); son una plantilla.
- Confirma tu tarifa de Mercado Pago y las condiciones de uso comercial de cada proveedor.
- Entrega al cliente: acceso de administrador, la `DATA_KEY` guardada con seguridad, los códigos de respaldo del 2FA y esta guía.
