import type { Game } from '@org/contracts';
import type { schema } from '@org/db';

/** Converts a `games` row into the API's `Game` shape (Date → ISO string). */
export function toGame(row: schema.GameRow): Game {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
