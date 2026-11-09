import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
export default {
  output: 'standalone',           // imagen Docker liviana
  poweredByHeader: false,
  images: { unoptimized: true }, // usamos <img>; así no se carga el optimizador de imágenes
  transpilePackages: ['@dip/shared'],
  experimental: {
    instrumentationHook: true,     // migraciones + validación de entorno al arrancar
    outputFileTracingRoot: root,   // incluye los paquetes del monorepo
    serverComponentsExternalPackages: ['@libsql/client', 'libsql', 'nodemailer', 'pdfkit', 'exceljs', 'qrcode', 'busboy'],
    // Archivos que estas librerías leen en tiempo de ejecución y el empaquetado liviano no detecta (sin ellos, exportar reportes falla en producción)
    outputFileTracingIncludes: { '/api/v1/reports/export': [
      '../../node_modules/pdfkit/js/data/**/*', '../../node_modules/pdfkit/js/standard-fonts/**/*',
      '../../node_modules/async-function/*', '../../node_modules/generator-function/*',
    ] },
  },
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ] }];
  },
};
