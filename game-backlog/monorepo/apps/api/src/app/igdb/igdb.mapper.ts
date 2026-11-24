import { igdbSearchResultSchema, type IgdbSearchResult } from '@org/contracts';
import { z } from 'zod';

/** Fields we request from IGDB's /games endpoint (Apicalypse dot notation expands references). */
export const IGDB_GAME_FIELDS = [
  'name',
  'first_release_date',
  'cover.image_id',
  'genres.name',
  'involved_companies.developer',
  'involved_companies.publisher',
  'involved_companies.company.name',
].join(', ');

/**
 * IGDB's raw game shape, for the fields above. IGDB leaves a field out
 * entirely when it has no data (it never sends null), hence `optional`.
 * API-only: the web app sees `IgdbSearchResult`.
 */
export const igdbRawGameSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  /** Unix seconds. */
  first_release_date: z.number().int().optional(),
  cover: z.object({ image_id: z.string().min(1) }).optional(),
  genres: z.array(z.object({ name: z.string().min(1) })).optional(),
  involved_companies: z
    .array(
      z.object({
        company: z.object({ name: z.string().min(1) }).optional(),
        developer: z.boolean().optional(),
        publisher: z.boolean().optional(),
      }),
    )
    .optional(),
});
export type IgdbRawGame = z.infer<typeof igdbRawGameSchema>;

const COVER_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big';

/** Unix seconds -> `YYYY-MM-DD` (UTC, matching IGDB's own date display). */
function toIsoDate(seconds: number): string {
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function firstCompany(
  companies: IgdbRawGame['involved_companies'],
  role: 'developer' | 'publisher',
): string | null {
  const name = companies?.find((c) => c[role] && c.company)?.company?.name;
  return name ? name.slice(0, 200) : null;
}

/** Raw IGDB game -> our search result (truncated to fit `gameSchema` limits). */
export function toIgdbSearchResult(raw: IgdbRawGame): IgdbSearchResult {
  const genres = [
    ...new Set((raw.genres ?? []).map((g) => g.name.slice(0, 50))),
  ].slice(0, 20);
  return {
    igdbId: raw.id,
    title: raw.name.slice(0, 200),
    genres,
    developer: firstCompany(raw.involved_companies, 'developer'),
    publisher: firstCompany(raw.involved_companies, 'publisher'),
    releaseDate:
      raw.first_release_date === undefined
        ? null
        : toIsoDate(raw.first_release_date),
    coverImageUrl: raw.cover ? `${COVER_URL}/${raw.cover.image_id}.jpg` : null,
  };
}

/**
 * Checks and maps one item of IGDB's response. Returns null for an item that
 * doesn't fit, so one odd game doesn't empty the whole result list.
 */
export function parseIgdbGame(item: unknown): IgdbSearchResult | null {
  const raw = igdbRawGameSchema.safeParse(item);
  if (!raw.success) return null;
  const result = igdbSearchResultSchema.safeParse(toIgdbSearchResult(raw.data));
  return result.success ? result.data : null;
}
