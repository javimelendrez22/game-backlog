import { z } from 'zod';
import { gameSchema } from './game.js';

/** GET /igdb/search query string. Trim first, so "   " fails `min`. */
export const igdbSearchQuerySchema = z.object({
  search: z.string().trim().min(2).max(100),
});
export type IgdbSearchQuery = z.infer<typeof igdbSearchQuerySchema>;

/**
 * One IGDB match, already in our `Game` field shapes, so picking it can be
 * spread straight into a `CreateGameInput`. Platforms are left out on purpose:
 * the user picks those, and IGDB's platform list doesn't map onto ours.
 */
export const igdbSearchResultSchema = gameSchema
  .pick({
    title: true,
    genres: true,
    developer: true,
    publisher: true,
    releaseDate: true,
    coverImageUrl: true,
  })
  .extend({ igdbId: z.number().int().positive() });
export type IgdbSearchResult = z.infer<typeof igdbSearchResultSchema>;

/** GET /igdb/search response, best match first. */
export const igdbSearchResponseSchema = z.object({
  items: z.array(igdbSearchResultSchema),
});
export type IgdbSearchResponse = z.infer<typeof igdbSearchResponseSchema>;
