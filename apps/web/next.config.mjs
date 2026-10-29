import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** @type {import('next').NextConfig} */
export default {
  output: 'standalone',           // imagen Docker liviana
  poweredByHeader: false,
  transpilePackages: ['@dip/shared'],
  experimental: {
    instrumentationHook: true,     // migraciones + validación de entorno al arrancar
    outputFileTracingRoot: root,   // incluye los paquetes del monorepo
    serverComponentsExternalPackages: ['@libsql/client', 'libsql'],
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
