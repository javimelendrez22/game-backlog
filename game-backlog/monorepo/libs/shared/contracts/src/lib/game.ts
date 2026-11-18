import { z } from 'zod';
import {
  idSchema,
  isoDateTimeSchema,
  paginated,
  paginationQuerySchema,
  sortOrderSchema,
} from './common.js';
import { platformSchema } from './platform.js';

/** Where a game sits in the user's backlog. */
export const gameStatusSchema = z.enum([
  'wishlist',
  'backlog',
  'playing',
  'completed',
  'dropped',
]);
export type GameStatus = z.infer<typeof gameStatusSchema>;

/** Game as returned by the API. */
export const gameSchema = z.object({
  id: idSchema,
  /** IGDB game id for imported games (unique across the backlog); null if added by hand. */
  igdbId: z.number().int().positive().nullable(),
  title: z.string().min(1).max(200),
  platforms: z.array(platformSchema).min(1),
  genres: z.array(z.string().min(1).max(50)).max(20),
  developer: z.string().max(200).nullable(),
  publisher: z.string().max(200).nullable(),
  releaseDate: z.iso.date().nullable(),
  coverImageUrl: z.url().nullable(),
  status: gameStatusSchema,
  /** Personal rating, 1-10. */
  rating: z.number().int().min(1).max(10).nullable(),
  hoursPlayed: z.number().min(0).nullable(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});
export type Game = z.infer<typeof gameSchema>;

/** POST /games — server owns id and timestamps; optional fields get defaults. */
export const createGameSchema = z.object({
  igdbId: gameSchema.shape.igdbId.default(null),
  title: gameSchema.shape.title,
  platforms: gameSchema.shape.platforms,
  genres: gameSchema.shape.genres.default([]),
  developer: gameSchema.shape.developer.default(null),
  publisher: gameSchema.shape.publisher.default(null),
  releaseDate: gameSchema.shape.releaseDate.default(null),
  coverImageUrl: gameSchema.shape.coverImageUrl.default(null),
  status: gameStatusSchema.default('backlog'),
  rating: gameSchema.shape.rating.default(null),
  hoursPlayed: gameSchema.shape.hoursPlayed.default(null),
});
export type CreateGame = z.infer<typeof createGameSchema>;
export type CreateGameInput = z.input<typeof createGameSchema>;

/** PATCH /games/:id — any subset of the creatable fields except igdbId, which is fixed at import. */
export const updateGameSchema = z
  .object({
    title: gameSchema.shape.title,
    platforms: gameSchema.shape.platforms,
    genres: gameSchema.shape.genres,
    developer: gameSchema.shape.developer,
    publisher: gameSchema.shape.publisher,
    releaseDate: gameSchema.shape.releaseDate,
    coverImageUrl: gameSchema.shape.coverImageUrl,
    status: gameStatusSchema,
    rating: gameSchema.shape.rating,
    hoursPlayed: gameSchema.shape.hoursPlayed,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
export type UpdateGame = z.infer<typeof updateGameSchema>;

export const gameIdParamSchema = z.object({ id: idSchema });

export const gameSortFieldSchema = z.enum([
  'title',
  'releaseDate',
  'rating',
  'hoursPlayed',
  'createdAt',
  'updatedAt',
]);

/** GET /games query string. */
export const listGamesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: gameStatusSchema.optional(),
  platform: platformSchema.optional(),
  genre: z.string().min(1).max(50).optional(),
  sortBy: gameSortFieldSchema.default('createdAt'),
  sortOrder: sortOrderSchema.default('desc'),
});
export type ListGamesQuery = z.infer<typeof listGamesQuerySchema>;

export const gameListResponseSchema = paginated(gameSchema);
export type GameListResponse = z.infer<typeof gameListResponseSchema>;
