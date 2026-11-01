import { assertProdEnv } from './lib/env';
import { runMigrations } from './db/migrate';
import { bootstrapAdmin } from './db/bootstrap';
import { startScheduler } from './lib/notifications';

export async function start() {
  assertProdEnv();
  await runMigrations();
  await bootstrapAdmin();
  startScheduler();
  console.log('[dip-house] base lista');
}
