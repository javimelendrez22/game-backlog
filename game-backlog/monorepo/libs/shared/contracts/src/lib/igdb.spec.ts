import { createGameSchema } from './game.js';
import { igdbSearchQuerySchema, igdbSearchResultSchema } from './igdb.js';

describe('igdb contracts', () => {
  it('trims the search before checking its length', () => {
    expect(igdbSearchQuerySchema.parse({ search: '  gta vi ' })).toEqual({
      search: 'gta vi',
    });
    expect(igdbSearchQuerySchema.safeParse({ search: '   ' }).success).toBe(
      false,
    );
    expect(igdbSearchQuerySchema.safeParse({ search: 'a' }).success).toBe(
      false,
    );
    expect(igdbSearchQuerySchema.safeParse({}).success).toBe(false);
  });

  it('accepts a result with nothing but an id and a title', () => {
    expect(
      igdbSearchResultSchema.safeParse({
        igdbId: 1,
        title: 'Obscure Game',
        genres: [],
        developer: null,
        publisher: null,
        releaseDate: null,
        coverImageUrl: null,
      }).success,
    ).toBe(true);
  });

  it('spreads into a valid create body once platforms are added', () => {
    const result = igdbSearchResultSchema.parse({
      igdbId: 52189,
      title: 'Grand Theft Auto VI',
      genres: ['Shooter', 'Adventure'],
      developer: 'Rockstar Games',
      publisher: 'Rockstar Games',
      releaseDate: '2026-11-19',
      coverImageUrl:
        'https://images.igdb.com/igdb/image/upload/t_cover_big/cocv1v.jpg',
    });
    expect(
      createGameSchema.safeParse({ ...result, platforms: ['playstation-5'] })
        .success,
    ).toBe(true);
  });
});
