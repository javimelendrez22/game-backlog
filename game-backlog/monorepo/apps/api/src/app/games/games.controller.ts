import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  createGameSchema,
  gameIdParamSchema,
  listGamesQuerySchema,
  type CreateGame,
  type Game,
  type GameIdParam,
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

  /**
   * GET /api/games/:id — one game. 400 (`issues.id`) for a non-uuid id,
   * 404 when no game has it. The whole params object is validated, so the
   * error names the field; `id` is then pulled out of it.
   */
  @Get(':id')
  async findById(
    @Param(new ZodValidationPipe(gameIdParamSchema)) { id }: GameIdParam,
  ): Promise<Game> {
    const game = await this.games.findById(id);
    if (!game) {
      throw new NotFoundException({ message: 'Game not found', id });
    }
    return game;
  }

  /** POST /api/games — add a game to the backlog. Responds 201 with the created game. */
  @Post()
  create(
    @Body(new ZodValidationPipe(createGameSchema)) body: CreateGame,
  ): Promise<Game> {
    return this.games.create(body);
  }
}
