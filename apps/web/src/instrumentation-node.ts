import { assertProdEnv } from './lib/env';
import { runMigrations } from './db/migrate';
import { bootstrapAdmin } from './db/bootstrap';
import { startScheduler } from './lib/notifications';
import { startMaintenance } from './lib/maintenance';

export async function start() {
  assertProdEnv();
  await runMigrations();
  await bootstrapAdmin();
  startScheduler();
  startMaintenance();
  console.log('[dip-house] base lista');
}
