import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? 'file:./dev.db';
const base = { schema: './src/db/schema.ts', out: './drizzle' };
// Local: SQLite en archivo. Producción: Turso (libsql://...) con DATABASE_AUTH_TOKEN.
export default url.startsWith('libsql') || url.startsWith('https')
  ? defineConfig({ ...base, dialect: 'turso', dbCredentials: { url, authToken: process.env.DATABASE_AUTH_TOKEN! } })
  : defineConfig({ ...base, dialect: 'sqlite', dbCredentials: { url } });
