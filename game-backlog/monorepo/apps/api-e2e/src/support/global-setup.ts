import { waitForPortOpen } from '@nx/node/utils';
import { parse } from 'dotenv';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

/* eslint-disable */
var __TEARDOWN_MESSAGE__: string;

/**
 * Empties every table in the e2e database so each run starts clean.
 * Uses the same apps/api/.env.test that the serve-e2e target loads,
 * and refuses to run unless the database name contains "test".
 */
async function resetTestDatabase() {
  const envFile = join(__dirname, '../../../api/.env.test');
  const url = parse(readFileSync(envFile)).DATABASE_URL;
  if (!url) {
    throw new Error(`DATABASE_URL is not set in ${envFile}`);
  }
  const dbName = new URL(url).pathname.slice(1);
  if (!dbName.includes('test')) {
    throw new Error(
      `Refusing to truncate "${dbName}": e2e database name must contain "test"`,
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ tablename: string }>(
      `select tablename from pg_tables where schemaname = 'public'`,
    );
    if (rows.length > 0) {
      const tables = rows.map((r) => `public."${r.tablename}"`).join(', ');
      await client.query(`truncate table ${tables} restart identity cascade`);
    }
    console.log(`Truncated ${rows.length} table(s) in ${dbName}`);
  } finally {
    await client.end();
  }
}

module.exports = async function () {
  // Start services that that the app needs to run (e.g. database, docker-compose, etc.).
  console.log('\nSetting up...\n');

  await resetTestDatabase();

  const host = process.env.HOST ?? 'localhost';
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await waitForPortOpen(port, { host });

  // Hint: Use `globalThis` to pass variables to global teardown.
  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
