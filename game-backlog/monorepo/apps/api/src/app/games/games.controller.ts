import { Body, Controller, Post } from '@nestjs/common';
import { createGameSchema, type CreateGame, type Game } from '@org/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  /** POST /api/games — add a game to the backlog. Responds 201 with the created game. */
  @Post()
  create(
    @Body(new ZodValidationPipe(createGameSchema)) body: CreateGame,
  ): Promise<Game> {
    return this.games.create(body);
  }
}
