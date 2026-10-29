import { assertProdEnv } from './lib/env';
import { runMigrations } from './db/migrate';

export async function start() {
  assertProdEnv();
  await runMigrations();
  console.log('[dip-house] base lista');
}
