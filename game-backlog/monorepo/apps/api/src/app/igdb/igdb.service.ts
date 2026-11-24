import { Injectable, Logger } from '@nestjs/common';
import type { IgdbSearchResponse, IgdbSearchResult } from '@org/contracts';
import { IgdbClient, IgdbRequestError } from './igdb.client';
import { IGDB_GAME_FIELDS, parseIgdbGame } from './igdb.mapper';

const RESULT_LIMIT = 10;

/**
 * IGDB `game_type` ids worth adding to a backlog: main game, standalone
 * expansion, remake, remaster, expanded game, port. Leaves out DLC, bundles,
 * mods, episodes, updates and packs.
 */
const BACKLOG_GAME_TYPES = '(0,4,8,9,10,11)';

/** Escapes a value for an Apicalypse string literal. */
function apicalypseString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

@Injectable()
export class IgdbService {
  private readonly logger = new Logger(IgdbService.name);

  constructor(private readonly client: IgdbClient) {}

  /** Up to 10 IGDB games matching `search`, best match first. Editions (version_parent) are left out. */
  async search(search: string): Promise<IgdbSearchResponse> {
    const body = [
      `search ${apicalypseString(search)};`,
      `fields ${IGDB_GAME_FIELDS};`,
      `where version_parent = null & game_type = ${BACKLOG_GAME_TYPES};`,
      `limit ${RESULT_LIMIT};`,
    ].join(' ');

    const raw = await this.client.query<unknown>('games', body);
    if (!Array.isArray(raw)) {
      throw new IgdbRequestError('IGDB /games did not return an array');
    }

    const items: IgdbSearchResult[] = [];
    for (const item of raw) {
      const result = parseIgdbGame(item);
      if (result) items.push(result);
      else
        this.logger.warn(
          `Skipped an IGDB game that didn't parse: ${JSON.stringify(item).slice(0, 300)}`,
        );
    }
    return { items };
  }
}
