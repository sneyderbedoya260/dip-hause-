import { defineConfig } from 'drizzle-kit';

// Solo se usa para GENERAR migraciones (npm run db:generate). Se aplican con db:migrate / al arrancar la app.
export default defineConfig({ dialect: 'sqlite', schema: './src/db/schema.ts', out: './drizzle', dbCredentials: { url: process.env.DATABASE_URL ?? 'file:./dev.db' } });
