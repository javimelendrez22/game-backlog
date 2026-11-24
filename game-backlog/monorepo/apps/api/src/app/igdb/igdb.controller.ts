import {
  BadGatewayException,
  Controller,
  Get,
  Logger,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  igdbSearchQuerySchema,
  type IgdbSearchQuery,
  type IgdbSearchResponse,
} from '@org/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { IgdbNotConfiguredError, IgdbRequestError } from './igdb.client';
import { IgdbService } from './igdb.service';

@Controller('igdb')
export class IgdbController {
  private readonly logger = new Logger(IgdbController.name);

  constructor(private readonly igdb: IgdbService) {}

  /**
   * GET /api/igdb/search?search=… — IGDB matches for the add-a-game form.
   * 503 when IGDB credentials aren't set, 502 when IGDB fails.
   */
  @Get('search')
  async search(
    @Query(new ZodValidationPipe(igdbSearchQuerySchema)) query: IgdbSearchQuery,
  ): Promise<IgdbSearchResponse> {
    try {
      return await this.igdb.search(query.search);
    } catch (err) {
      if (err instanceof IgdbNotConfiguredError) {
        throw new ServiceUnavailableException({
          message: 'IGDB search is not configured',
          code: 'igdb_not_configured',
        });
      }
      if (err instanceof IgdbRequestError) {
        this.logger.error(err.message);
        throw new BadGatewayException({
          message: 'IGDB search failed',
          code: 'igdb_unavailable',
        });
      }
      throw err;
    }
  }
}
