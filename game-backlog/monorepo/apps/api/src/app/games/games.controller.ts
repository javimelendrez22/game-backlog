import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  createGameSchema,
  listGamesQuerySchema,
  type CreateGame,
  type Game,
  type GameListResponse,
  type ListGamesQuery,
} from '@org/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private readonly games: GamesService) {}

  /** GET /api/games — paginated, filterable, sortable list of the backlog. */
  @Get()
  list(
    @Query(new ZodValidationPipe(listGamesQuerySchema)) query: ListGamesQuery,
  ): Promise<GameListResponse> {
    return this.games.list(query);
  }

  /** POST /api/games — add a game to the backlog. Responds 201 with the created game. */
  @Post()
  create(
    @Body(new ZodValidationPipe(createGameSchema)) body: CreateGame,
  ): Promise<Game> {
    return this.games.create(body);
  }
}
