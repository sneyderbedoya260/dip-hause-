# Despliegue (Vercel + Turso + Vercel Blob)

## 1. Subir a GitHub
```bash
git remote add origin git@github.com:TU_USUARIO/dip-house.git   # repo vacío creado en github.com/new
git push -u origin main
```

## 2. Base de datos (Turso, gratis)
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup
turso db create dip-house
turso db show dip-house --url          # → DATABASE_URL (libsql://...)
turso db tokens create dip-house       # → DATABASE_AUTH_TOKEN
```
Crea las tablas y los datos iniciales desde tu computador:
```bash
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:push
DATABASE_URL=libsql://... DATABASE_AUTH_TOKEN=... npm run db:seed
```

## 3. Vercel
1. vercel.com → Add New Project → importa el repo.
2. **Root Directory:** `apps/web` (deja activo "Include source files outside of the Root Directory").
3. Variables de entorno: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ADMIN_PASSWORD`, `JWT_SECRET` (cadena larga aleatoria), `BUSINESS_TZ=America/Bogota`, `APP_URL=https://TU-PROYECTO.vercel.app`, `MP_ACCESS_TOKEN`.
4. Storage → Create → Blob; conéctalo al proyecto (agrega `BLOB_READ_WRITE_TOKEN`).
5. Deploy.

## 4. Mercado Pago
- Usa primero las credenciales de **prueba**. En el panel de MP configura el webhook: `https://TU-PROYECTO.vercel.app/api/v1/payments/webhook` (evento *Pagos*).
- Pasa a credenciales de producción solo cuando una compra de prueba funcione.

## Límites conocidos
- Las subidas pasan por el servidor: máximo ~4.5 MB por archivo en Vercel. Para videos grandes hay que migrar a subida directa desde el navegador.
- El panel de admin con pantallas aún no existe; el admin opera por la API.
