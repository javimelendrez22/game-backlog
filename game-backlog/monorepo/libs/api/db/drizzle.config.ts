import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Nx runs the db-* targets from the workspace root, so paths are relative to it.
config({ path: 'apps/api/.env', quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set (expected in apps/api/.env)');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './libs/api/db/src/schema',
  out: './libs/api/db/drizzle',
  dbCredentials: { url },
});
