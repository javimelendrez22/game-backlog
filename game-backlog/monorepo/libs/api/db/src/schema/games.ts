import {
  gameStatusSchema,
  platformSchema,
  type GameStatus,
  type Platform,
} from '@org/contracts';
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Enum values come from the shared contracts so the DB and API can't drift.
// zod's `.options` is typed as a plain array; pgEnum wants a non-empty tuple.
export const gameStatusEnum = pgEnum(
  'game_status',
  gameStatusSchema.options as [GameStatus, ...GameStatus[]],
);

export const platformEnum = pgEnum(
  'platform',
  platformSchema.options as [Platform, ...Platform[]],
);

/** Mirrors `gameSchema` in @org/contracts. */
export const games = pgTable(
  'games',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** IGDB game id for imported games; unique, null for games added by hand. */
    igdbId: integer('igdb_id'),
    title: varchar('title', { length: 200 }).notNull(),
    platforms: platformEnum('platforms').array().notNull(),
    genres: text('genres').array().notNull().default(sql`'{}'::text[]`),
    developer: varchar('developer', { length: 200 }),
    publisher: varchar('publisher', { length: 200 }),
    releaseDate: date('release_date', { mode: 'string' }),
    coverImageUrl: text('cover_image_url'),
    status: gameStatusEnum('status').notNull().default('backlog'),
    /** Personal rating, 1-10. */
    rating: smallint('rating'),
    hoursPlayed: doublePrecision('hours_played'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('games_status_idx').on(t.status),
    uniqueIndex('games_igdb_id_unique').on(t.igdbId),
    check('games_igdb_id_positive', sql`${t.igdbId} > 0`),
    check('games_platforms_not_empty', sql`cardinality(${t.platforms}) >= 1`),
    check('games_rating_range', sql`${t.rating} between 1 and 10`),
    check('games_hours_played_non_negative', sql`${t.hoursPlayed} >= 0`),
  ],
);

export type GameRow = typeof games.$inferSelect;
export type NewGameRow = typeof games.$inferInsert;
