import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Creates a Drizzle client backed by a pg connection pool.
 * The caller owns the URL (read it from env in the app) and should
 * call `pool.end()` on shutdown.
 */
export function createDb(url: string) {
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool });
  return { db, pool };
}

export type Database = ReturnType<typeof createDb>['db'];
