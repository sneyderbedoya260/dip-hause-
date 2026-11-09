# Arquitectura de Dip House

## Resumen en una frase
Una sola aplicación **Next.js** (pantallas + API) escrita en **TypeScript**, con una base de datos **SQLite**, que corre en un contenedor **Docker** detrás de **Caddy** (HTTPS) en un servidor de Hetzner.

```
Navegador / app móvil futura
        │  HTTPS
     [ Caddy ]  ← certificado automático, compresión, tope de subida 200 MB
        │
   [ App Next.js (Node 22) ]  ← pantallas (React) + API REST /api/v1 + tareas programadas
        │
   [ Volumen /data ]  base SQLite · fotos/videos del catálogo · evidencias (privadas) · copias
```
Servicios externos: **Mercado Pago** (pagos), un **SMTP** (correo: recuperar contraseña, verificación, recordatorios).

## Lenguajes y qué se usa en cada uno
| Lenguaje | Líneas aprox. | Para qué |
|---|---|---|
| **TypeScript** (`.ts`) | ~2.000 | Todo el «cerebro»: API, base de datos, seguridad, reportes, correos, tareas programadas |
| **TSX** (`.tsx`) = TypeScript + React | ~1.100 | Las pantallas: tienda, carrito, panel de administración, login, reportes |
| **SQL** (`.sql`) | ~175 | Migraciones de la base de datos (se generan solas desde el esquema TypeScript) |
| **CSS** | ~140 | Todo el diseño (tema oscuro negro/rojo/amarillo, animaciones) en `globals.css` |
| **Bash** (`.sh`) | ~90 | Scripts del servidor: preparar, revisar, actualizar, copias de seguridad |
| **YAML, Dockerfile, Caddyfile** | ~100 | Configuración: contenedores, HTTPS, publicación automática desde GitHub |
| **JSON / Markdown** | — | Configuración de paquetes y esta documentación |

*TypeScript* es JavaScript con tipos: el editor y el compilador detectan errores antes de ejecutar. *React* es la librería que arma las pantallas. No hay Python ni PHP en el proyecto.

## Tecnologías principales
Next.js 14 · React 18 · Node.js 22 · **Drizzle ORM** + SQLite (libsql) · **Zod** (validación de datos) · Mercado Pago SDK · nodemailer (correo) · **exceljs** (Excel) · **pdfkit** (PDF con gráficos) · qrcode (QR de 2FA) · busboy (subidas a disco sin gastar memoria).

## Estructura de carpetas
```
dip-house/
├─ apps/web/                  ← LA aplicación
│  ├─ drizzle/                  migraciones SQL versionadas (se aplican solas al arrancar)
│  ├─ public/                   logo y archivos estáticos
│  └─ src/
│     ├─ app/                   pantallas (cada carpeta = una URL) y API
│     │  ├─ page.tsx              inicio (lavadas y productos)
│     │  ├─ agendar/[washId]/     agendamiento: calendario, adicionales, evidencias, pago
│     │  ├─ carrito/              carrito y pedido de productos
│     │  ├─ ingresar, registro…   login y cuenta de clientes
│     │  ├─ mi-cuenta/            citas y pedidos del cliente
│     │  ├─ privacidad, terminos/ textos legales
│     │  ├─ admin/                login del personal + panel (reportes, citas, calendario,
│     │  │                        pedidos, lavadas, productos, personal, ajustes, seguridad)
│     │  └─ api/v1/               API REST (36 rutas) — la misma para web y futura app móvil
│     ├─ components/            piezas de pantalla reutilizables (admin/, cart/, formularios)
│     ├─ db/                    esquema (13 tablas), conexión, migraciones, administrador inicial
│     ├─ lib/                   lógica de negocio
│     │  ├─ auth/                 contraseñas, sesiones, roles, 2FA, tokens, límites de intentos
│     │  ├─ availability.ts       días y horas disponibles según duración y horario
│     │  ├─ reports.ts            cálculo de reportes (+ report-xlsx.ts y report-pdf.ts)
│     │  ├─ notifications.ts      recordatorios por correo (empleados y clientes)
│     │  ├─ maintenance.ts        limpieza y política de retención de evidencias
│     │  └─ upload.ts             subida de archivos grandes directo a disco
│     ├─ middleware.ts          primera barrera: sin cookie no se renderiza /admin ni /mi-cuenta
│     └─ instrumentation*.ts    al arrancar: valida configuración, migra la base, crea el admin
├─ packages/shared/           reglas y tipos compartidos (validaciones Zod) — las usará la app móvil
├─ scripts/                   server-setup, preflight, deploy, backup
├─ docs/                      esta guía
├─ Dockerfile · docker-compose.yml · Caddyfile
└─ .github/workflows/         CI (pruebas de compilación) y release (publica la imagen)
```

## Tablas de la base de datos (13)
`users`, `sessions`, `auth_tokens` (cuentas) · `washes`, `wash_extras`, `products`, `media` (catálogo) · `appointments`, `evidence`, `notifications` (citas) · `orders`, `order_items` (pedidos) · `settings` (horario y retención).

## Flujos importantes
- **Agendar:** el cliente elige lavada y adicionales → calendario con días/horas libres → sube evidencias (obligatorio) → acepta privacidad → paga (Mercado Pago o al finalizar) → la cita queda *pendiente* → el administrador confirma y asigna empleado.
- **Dinero que entró:** se cuenta por fecha de **pago recibido** (Mercado Pago lo registra solo; efectivo lo marca el admin). Lo cancelado se muestra aparte como «por reembolsar».
- **Reportes:** día / semana / mes / año / rango; clic en una fecha muestra sus pagos, pedidos y citas. Excel (datos de las fechas pedidas) y PDF (gráficos y tablas).
- **Seguridad:** contraseñas con scrypt · sesiones en servidor revocables · bloqueo por intentos · CSRF por origen · 2FA (TOTP) obligatorio para el personal · evidencias privadas · secretos de 2FA cifrados (AES-256-GCM).

## Por qué es liviano
La imagen la compila GitHub (el servidor no compila); la app usa ~200 MB de RAM (tope 768 MB); los videos se escriben a disco sin pasar por memoria; Excel y PDF se cargan solo al descargar un reporte; los logs tienen tope; SQLite no necesita un servidor de base de datos aparte.
