import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { sql, type Database } from '@org/db';
import { InjectDb } from './database.tokens';

@Controller('health')
export class HealthController {
  constructor(@InjectDb() private readonly db: Database) {}

  /** GET /api/health/db — runs `select 1` to confirm the database is reachable. */
  @Get('db')
  async checkDb() {
    try {
      await this.db.execute(sql`select 1`);
      return { ok: true };
    } catch (err) {
      throw new ServiceUnavailableException({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
