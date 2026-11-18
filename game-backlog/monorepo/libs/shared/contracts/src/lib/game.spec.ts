import {
  createGameSchema,
  gameListResponseSchema,
  listGamesQuerySchema,
  updateGameSchema,
} from './game.js';

describe('game contracts', () => {
  it('applies defaults when creating a game', () => {
    const game = createGameSchema.parse({ title: 'Hades', platforms: ['pc'] });
    expect(game.status).toBe('backlog');
    expect(game.genres).toEqual([]);
    expect(game.rating).toBeNull();
  });

  it('rejects a game with no platforms or an out-of-range rating', () => {
    expect(createGameSchema.safeParse({ title: 'x', platforms: [] }).success).toBe(false);
    expect(
      createGameSchema.safeParse({ title: 'x', platforms: ['pc'], rating: 11 }).success,
    ).toBe(false);
  });

  it('only accepts owned platforms', () => {
    expect(
      createGameSchema.safeParse({ title: 'x', platforms: ['nintendo-switch-2'] }).success,
    ).toBe(true);
    expect(createGameSchema.safeParse({ title: 'x', platforms: ['xbox'] }).success).toBe(false);
  });

  it('defaults igdbId to null and only accepts positive integers', () => {
    expect(createGameSchema.parse({ title: 'x', platforms: ['pc'] }).igdbId).toBeNull();
    expect(
      createGameSchema.parse({ title: 'x', platforms: ['pc'], igdbId: 1942 }).igdbId,
    ).toBe(1942);
    for (const igdbId of [0, -5, 1.5, '1942']) {
      expect(
        createGameSchema.safeParse({ title: 'x', platforms: ['pc'], igdbId }).success,
      ).toBe(false);
    }
  });

  it('requires at least one field on update', () => {
    expect(updateGameSchema.safeParse({}).success).toBe(false);
    expect(updateGameSchema.safeParse({ status: 'completed' }).success).toBe(true);
  });

  it('coerces and defaults list query params', () => {
    const q = listGamesQuerySchema.parse({ page: '2', status: 'playing' });
    expect(q).toMatchObject({ page: 2, pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' });
  });

  it('validates a paginated response', () => {
    const res = gameListResponseSchema.parse({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
    expect(res.items).toEqual([]);
  });
});
