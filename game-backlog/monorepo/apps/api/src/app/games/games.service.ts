import { ConflictException, Injectable } from '@nestjs/common';
import type { CreateGame, Game } from '@org/contracts';
import { schema, type Database } from '@org/db';
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
}
