import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Nx runs the db-* targets from the workspace root, so paths are relative to it.
// DB_ENV=test (e.g. `nx run db:db-migrate:test`) targets the e2e test database.
const envFile =
  process.env.DB_ENV === 'test' ? 'apps/api/.env.test' : 'apps/api/.env';
config({ path: envFile, quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(`DATABASE_URL is not set (expected in ${envFile})`);
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './libs/api/db/src/schema/index.ts',
  out: './libs/api/db/drizzle',
  dbCredentials: { url },
});
