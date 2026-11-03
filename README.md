# Dip House · Lavado premium a domicilio

Monorepo con la web, la API REST y el código compartido, pensado para sumar la **app móvil** (Expo / React Native) sin reescribir la lógica.

```
apps/web         Next.js 14 (web + API REST en /api/v1), tema oscuro, animaciones de carga
apps/mobile      (pendiente) Expo + React Native, consumirá /api/v1
packages/shared  Esquemas Zod, tipos y utilidades compartidos por web y móvil
```

## Arranque en desarrollo

```bash
npm install
cp .env.example apps/web/.env.local
npm run db:migrate && npm run db:seed   # base SQLite local + datos de ejemplo
npm run dev                             # http://localhost:3000  ·  admin de desarrollo: admin@dip.local / admin-dev-12345  (/admin/ingresar)
```
Producción: ver [DEPLOY.md](DEPLOY.md) (Docker + HTTPS, migraciones automáticas, backups).

## Panel de administración (`/admin`)
| Sección | Quién | Qué hace |
|---|---|---|
| **Citas** | admin | Por confirmar / confirmadas / completadas / canceladas; confirmar, rechazar, completar y **asignar empleado** |
| **Calendario** | admin | Mes completo con conteo de citas confirmadas y por confirmar por día; al elegir un día: servicio, adicionales, cliente, **dirección con enlace a Maps**, teléfono |
| **Lavadas** | admin | Crear, editar, activar/desactivar; precio, duración, descripción, **fotos y videos de cualquier formato** y **servicios adicionales** |
| **Productos** | admin | Crear, editar, activar/desactivar; foto, **video opcional**, precio, descripción |
| **Personal** | admin | Invitar empleados/administradores por correo, activar/desactivar |
| **Ajustes** | admin | Días de servicio y horas de apertura/cierre (definen qué ven los clientes disponible) |
| **Mis servicios** | empleado | Solo sus servicios asignados; puede marcarlos como completados |

## Evidencias del estado del vehículo (obligatorias)
Para agendar, el cliente **debe** adjuntar al menos una foto o video del estado de su vehículo («Presente aquí las evidencias del estado de su vehículo»). Sin evidencias la API responde 400 y la pantalla no deja continuar.
- Se suben con `POST /api/v1/evidence` (una por una; cualquier formato de foto o video; invitados incluidos; límite por red y `EVIDENCE_MAX_MB`, 150 por defecto) y se envían como `evidenceIds` (1 a 10) al crear la cita. Cada evidencia solo se puede usar en una cita.
- Son **privadas**: se guardan fuera de `/uploads` (carpeta `evidence`) y solo se ven con sesión: el admin, el empleado **asignado** a esa cita o el cliente dueño. Las que se suben y no se usan se borran a las 24 h.
- El admin las ve en cada cita (lista y calendario) y puede abrirlas en grande.

## Autenticación y roles

| Rol | Entra por | Cookie | Sesión |
|---|---|---|---|
| **cliente** | `/ingresar`, `/registro` | `dh_c` (SameSite=Lax) | 14 días sin uso / 90 máx. |
| **empleado** y **admin** | `/admin/ingresar` | `dh_s` (SameSite=Strict) | 4 h sin uso / 12 h máx. |

- Dos pantallas, dos endpoints y dos cookies separadas: una cuenta de cliente no puede iniciar en el login del personal ni al revés (siempre responde el mismo error genérico).
- Contraseñas con scrypt; sesiones en base de datos (token aleatorio, solo se guarda su hash) y revocables; bloqueo progresivo tras 5 fallos; límite de intentos por IP y por correo; defensa CSRF por origen; respuestas idénticas exista o no el correo.
- El personal se crea desde el panel (invitación por correo con enlace de 48 h); no hay registro público de empleados.
- Recuperar contraseña: enlace de un solo uso (30 min) por correo; al usarlo se cierran todas las sesiones.
- Reservado para después: 2FA (TOTP) del personal (`users.totp_secret`), verificación de correo del cliente.

## Notificaciones (correo)
Un programador interno revisa cada minuto (con `NOTIFY_ENABLED=true`) y envía, una sola vez cada uno:
- **Empleado:** resumen de sus servicios confirmados del día, con dirección, teléfono y vehículo.
- **Admin:** aviso de los servicios del día que no tienen empleado asignado.
- **Cliente:** recordatorio el día anterior (desde `CUSTOMER_REMINDER_HOUR`) y otro unas 2 h antes.
Registro y reintentos (máx. 3) en la tabla `notifications`. Sin `SMTP_HOST` los correos se imprimen en la consola.

## API v1 (la misma para web y móvil)
Móvil: enviar `X-Client: mobile` en el login para recibir el `token` en la respuesta y usarlo como `Authorization: Bearer`.

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/washes`, `/products` (+ `/:id`), `/availability?washId=&days=&extraIds=` | público |
| POST | `/evidence` | público: sube una foto/video del vehículo → `{id, kind}` |
| GET | `/evidence/:id` | admin · empleado asignado · cliente dueño (privado) |
| POST | `/appointments` | público, **requiere `evidenceIds`** (si hay sesión de cliente, queda en su cuenta) |
| POST | `/auth/customer/login`, `/auth/staff/login`, `/auth/register` (cliente) | público |
| POST | `/auth/forgot`, `/auth/reset`, `/auth/logout` | público / sesión |
| GET | `/auth/me` · POST `/auth/password` | sesión |
| GET | `/me/appointments` | cliente |
| GET / PATCH | `/appointments`, `/appointments/:id` | admin (todas) · empleado (solo las suyas; solo completar) |
| GET / POST / PATCH | `/staff`, `/staff/:id` | admin |
| POST / PUT / DELETE | `/washes`, `/products`, `/uploads` | admin |
| POST | `/payments/preference`, `/payments/webhook` | público / Mercado Pago |

## Móvil
La app usará el mismo backend: login admin con `Authorization: Bearer`, `init_point` de Mercado Pago abierto en el navegador del sistema, y `@dip/shared` para validar formularios.
Los archivos subidos se guardan en `UPLOAD_DIR` y se sirven por `/uploads/*` con soporte de video en iPhone.

## Estado
Hecho: API completa, catálogo, agendamiento con disponibilidad, Mercado Pago (preferencia + webhook), splash y skeletons de carga.
Pendiente: panel admin (UI), calendario mensual, carrito de productos y pedidos, app móvil, firma del webhook de Mercado Pago, notificaciones.

## Subir a GitHub
```bash
git remote add origin git@github.com:TU_USUARIO/dip-house.git
git push -u origin main
```
