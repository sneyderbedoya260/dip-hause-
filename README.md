# Dip House · Lavado premium a domicilio

Monorepo con la web, la API REST y el código compartido, pensado para sumar la **app móvil** (Expo / React Native) sin reescribir la lógica.

```
apps/web         Next.js 14 (web + API REST en /api/v1), tema oscuro, animaciones de carga
apps/mobile      (pendiente) Expo + React Native, consumirá /api/v1
packages/shared  Esquemas Zod, tipos y utilidades compartidos por web y móvil
```

## Arranque

```bash
npm install
cp .env.example apps/web/.env.local     # ajusta ADMIN_PASSWORD y JWT_SECRET
npm run db:push && npm run db:seed      # crea la base local (SQLite) con datos de ejemplo
npm run dev                             # http://localhost:3000
```

## API v1 (la misma para web y móvil)

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/v1/washes`, `/products` (+ `/:id`) | público |
| GET | `/api/v1/availability?washId=&days=60` | público: días y horas libres |
| POST | `/api/v1/appointments` | público: crea cita *pendiente* (acepta `extraIds` de servicios adicionales) |
| POST | `/api/v1/payments/preference` | público: devuelve `init_point` de Mercado Pago |
| POST | `/api/v1/payments/webhook` | Mercado Pago |
| POST | `/api/v1/admin/login` | devuelve `token` (Bearer) y cookie httpOnly |
| GET / PATCH | `/api/v1/appointments`, `/:id` | admin: listar, confirmar, rechazar, completar |
| POST / PUT / DELETE | `/api/v1/washes`, `/products` | admin |
| POST | `/api/v1/uploads` | admin: foto o video en cualquier formato |

**Reglas de negocio:** toda cita nace `pendiente` y bloquea su horario (según la duración del servicio) hasta que el admin la confirme o rechace. El pago aprobado solo marca `pagado`; no confirma la cita.

## Móvil
La app usará el mismo backend: login admin con `Authorization: Bearer`, `init_point` de Mercado Pago abierto en el navegador del sistema, y `@dip/shared` para validar formularios.
En producción mueve las subidas a S3 / R2 / Cloudinary (`src/lib/storage.ts`) y cambia `DATABASE_URL` a Turso o Postgres.

## Estado
Hecho: API completa, catálogo, agendamiento con disponibilidad, Mercado Pago (preferencia + webhook), splash y skeletons de carga.
Pendiente: panel admin (UI), calendario mensual, carrito de productos y pedidos, app móvil, firma del webhook de Mercado Pago, notificaciones.

## Subir a GitHub
```bash
git remote add origin git@github.com:TU_USUARIO/dip-house.git
git push -u origin main
```
