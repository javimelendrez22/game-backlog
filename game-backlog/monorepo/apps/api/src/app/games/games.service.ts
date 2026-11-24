import { ConflictException, Injectable } from '@nestjs/common';
import type {
  CreateGame,
  Game,
  GameListResponse,
  ListGamesQuery,
} from '@org/contracts';
import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  ilike,
  schema,
  type Database,
} from '@org/db';
import { InjectDb } from '../database/database.tokens';
import { isUniqueViolation } from '../database/pg-errors';
import { toGame } from './games.mapper';

@Injectable()
export class GamesService {
  constructor(@InjectDb() private readonly db: Database) {}

  async create(input: CreateGame): Promise<Game> {
    try {
      const [row] = await this.db
        .insert(schema.games)
        .values(input)
        .returning();
      return toGame(row);
    } catch (err) {
      if (isUniqueViolation(err, 'games_igdb_id_unique')) {
        throw new ConflictException({
          message: 'Game is already in the backlog',
          igdbId: input.igdbId,
        });
      }
      throw err;
    }
  }

  /** One game by id, or null when no row matches (the caller decides what that means). */
  async findById(id: string): Promise<Game | null> {
    const [row] = await this.db
      .select()
      .from(schema.games)
      .where(eq(schema.games.id, id))
      .limit(1);
    return row ? toGame(row) : null;
  }

  /**
   * Deletes the game if it exists. A missing id is not an error: the caller
   * wanted it gone, and it is (see libs/shared/contracts/README.md).
   */
  async remove(id: string): Promise<void> {
    await this.db.delete(schema.games).where(eq(schema.games.id, id));
  }

  /** GET /api/games: filtered, sorted page of games plus the total match count. */
  async list(query: ListGamesQuery): Promise<GameListResponse> {
    const {
      search,
      status,
      platform,
      genre,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = query;
    const g = schema.games;

    // One WHERE for both queries, so the page and the total can't disagree.
    // `and()` drops the undefined entries, so absent filters don't constrain.
    const where = and(
      search ? ilike(g.title, `%${search}%`) : undefined,
      genre ? arrayContains(g.genres, [genre]) : undefined,
      status ? eq(g.status, status) : undefined,
      platform ? arrayContains(g.platforms, [platform]) : undefined,
    );
    const direction = sortOrder === 'asc' ? asc : desc;

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(g)
        .where(where)
        // id breaks ties, so rows with equal sort values keep a stable order across pages.
        .orderBy(direction(g[sortBy]), direction(g.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      this.db.select({ total: count() }).from(g).where(where),
    ]);

    return {
      items: rows.map(toGame),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
