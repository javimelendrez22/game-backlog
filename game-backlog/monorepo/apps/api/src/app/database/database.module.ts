import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { createDb, type Database } from '@org/db';
import type { Pool } from 'pg';
import { DB, DB_POOL } from './database.tokens';
import { HealthController } from './health.controller';

export { DB, InjectDb } from './database.tokens';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        const url = process.env.DATABASE_URL;
        if (!url) {
          throw new Error(
            'DATABASE_URL is not set (expected in apps/api/.env)',
          );
        }
        return createDb(url);
      },
    },
    {
      provide: DB,
      inject: [DB_POOL],
      useFactory: ({ db }: ReturnType<typeof createDb>): Database => db,
    },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DB_POOL) private readonly conn: { pool: Pool }) {}

  async onApplicationShutdown() {
    await this.conn.pool.end();
  }
}
