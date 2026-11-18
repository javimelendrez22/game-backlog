import { Injectable } from '@nestjs/common';
import type { CreateGame, Game } from '@org/contracts';
import { schema, type Database } from '@org/db';
import { InjectDb } from '../database/database.tokens';
import { toGame } from './games.mapper';

@Injectable()
export class GamesService {
  constructor(@InjectDb() private readonly db: Database) {}

  async create(input: CreateGame): Promise<Game> {
    const [row] = await this.db
      .insert(schema.games)
      .values(input)
      .returning();
    return toGame(row);
  }
}
