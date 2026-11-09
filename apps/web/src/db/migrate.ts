import path from 'node:path';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';
import { settings } from './schema';

/** Aplica las migraciones pendientes (idempotente) y deja la configuración base. Nunca borra datos. */
export async function runMigrations() {
  await db.run(sql`PRAGMA journal_mode = WAL`);
  await db.run(sql`PRAGMA busy_timeout = 5000`);
  await db.run(sql`PRAGMA synchronous = NORMAL`); // seguro con WAL; menos escrituras a disco
  await migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? path.join(process.cwd(), 'drizzle') });
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
}

if (process.argv[1]?.endsWith('migrate.ts')) {
  runMigrations().then(() => console.log('Migraciones aplicadas')).catch(e => { console.error(e); process.exit(1); });
}
