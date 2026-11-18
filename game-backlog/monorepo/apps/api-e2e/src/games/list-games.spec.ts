import axios from 'axios';
import {
  gameSchema,
  type CreateGameInput,
  type Game,
  type GameListResponse,
} from '@org/contracts';

// The e2e DB is only truncated once per run, and other specs insert games too.
// Each test tags its seed data with a unique genre and filters by it, so totals
// and ordering only ever see that test's own rows.
const uniqueGenre = () => `list-e2e-${Math.random().toString(36).slice(2, 10)}`;

const seed = async (genre: string, games: Partial<CreateGameInput>[]) => {
  const created: Game[] = [];
  // Sequential on purpose: createdAt order must match array order.
  for (const g of games) {
    const res = await axios.post<Game>('/api/games', {
      title: 'Untitled',
      platforms: ['pc'],
      ...g,
      genres: [genre, ...(g.genres ?? [])],
    });
    created.push(res.data);
  }
  return created;
};

const list = <T = GameListResponse>(params: Record<string, string | number>) =>
  axios.get<T>('/api/games', { params, validateStatus: () => true });

describe('GET /api/games', () => {
  it('returns { items, meta } with default paging', async () => {
    await seed(uniqueGenre(), [{ title: 'Default Paging' }]);
    const res = await list({});

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(res.data.meta).toMatchObject({ page: 1, pageSize: 20 });
    expect(res.data.meta.total).toBeGreaterThanOrEqual(1);
    expect(res.data.meta.totalPages).toBe(Math.ceil(res.data.meta.total / 20));
    expect(res.data.items.length).toBeLessThanOrEqual(20);
  });

  it('returns items in the Game shape with no extra fields', async () => {
    const genre = uniqueGenre();
    await seed(genre, [{ title: 'Shape Check', igdbId: null, rating: 7 }]);
    const res = await list({ genre });

    expect(res.status).toBe(200);
    expect(res.data.items).toHaveLength(1);
    for (const item of res.data.items) {
      expect(() => gameSchema.strict().parse(item)).not.toThrow();
    }
  });

  it('paginates without overlap and reports total/totalPages', async () => {
    const genre = uniqueGenre();
    await seed(genre, [
      { title: 'Page A' },
      { title: 'Page B' },
      { title: 'Page C' },
    ]);

    const p1 = await list({ genre, pageSize: 2, page: 1 });
    const p2 = await list({ genre, pageSize: 2, page: 2 });

    expect(p1.data.items).toHaveLength(2);
    expect(p2.data.items).toHaveLength(1);
    expect(p1.data.meta).toEqual({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
    expect(p2.data.meta).toEqual({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });

    const ids = [...p1.data.items, ...p2.data.items].map((g) => g.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('returns an empty page past the last page', async () => {
    const genre = uniqueGenre();
    await seed(genre, [{ title: 'Only One' }]);
    const res = await list({ genre, page: 5 });

    expect(res.status).toBe(200);
    expect(res.data.items).toEqual([]);
    expect(res.data.meta).toMatchObject({ page: 5, total: 1, totalPages: 1 });
  });

  it('returns an empty list when nothing matches', async () => {
    const res = await list({ genre: uniqueGenre() });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
  });

  describe('filters', () => {
    it('filters by status', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'Wish', status: 'wishlist' },
        { title: 'Playing', status: 'playing' },
      ]);
      const res = await list({ genre, status: 'playing' });

      expect(res.data.items.map((g) => g.title)).toEqual(['Playing']);
      expect(res.data.meta.total).toBe(1);
    });

    it('filters by platform (array contains)', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'PC Only', platforms: ['pc'] },
        { title: 'PS5 And PC', platforms: ['pc', 'playstation-5'] },
      ]);
      const res = await list({ genre, platform: 'playstation-5' });

      expect(res.data.items.map((g) => g.title)).toEqual(['PS5 And PC']);
    });

    it('filters by genre (array contains)', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'Metroidvania', genres: ['metroidvania'] },
        { title: 'Racer', genres: ['racing'] },
      ]);
      const res = await list({ genre, sortBy: 'title', sortOrder: 'asc' });

      expect(res.data.items.map((g) => g.title)).toEqual([
        'Metroidvania',
        'Racer',
      ]);
    });

    it('searches titles case-insensitively and partially', async () => {
      const genre = uniqueGenre();
      await seed(genre, [{ title: 'Hollow Knight' }, { title: 'Celeste' }]);
      const res = await list({ genre, search: 'hOLLow' });

      expect(res.data.items.map((g) => g.title)).toEqual(['Hollow Knight']);
    });

    it('combines filters with AND', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'Match', status: 'backlog', platforms: ['mobile'] },
        { title: 'Wrong Status', status: 'dropped', platforms: ['mobile'] },
        { title: 'Wrong Platform', status: 'backlog', platforms: ['pc'] },
      ]);
      const res = await list({ genre, status: 'backlog', platform: 'mobile' });

      expect(res.data.items.map((g) => g.title)).toEqual(['Match']);
    });
  });

  describe('sorting', () => {
    it('defaults to createdAt desc (newest first)', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'First' },
        { title: 'Second' },
        { title: 'Third' },
      ]);
      const res = await list({ genre });

      expect(res.data.items.map((g) => g.title)).toEqual([
        'Third',
        'Second',
        'First',
      ]);
    });

    it.each([
      ['asc', ['Alpha', 'Bravo', 'Charlie']],
      ['desc', ['Charlie', 'Bravo', 'Alpha']],
    ])('sorts by title %s', async (sortOrder, expected) => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'Bravo' },
        { title: 'Charlie' },
        { title: 'Alpha' },
      ]);
      const res = await list({ genre, sortBy: 'title', sortOrder });

      expect(res.data.items.map((g) => g.title)).toEqual(expected);
    });

    it('sorts by rating', async () => {
      const genre = uniqueGenre();
      await seed(genre, [
        { title: 'Mid', rating: 5 },
        { title: 'Top', rating: 10 },
        { title: 'Low', rating: 1 },
      ]);
      const res = await list({ genre, sortBy: 'rating', sortOrder: 'desc' });

      expect(res.data.items.map((g) => g.title)).toEqual(['Top', 'Mid', 'Low']);
    });
  });

  // One bad param per case, so each validation rule is pinned down on its own.
  it.each([
    ['pageSize is above 100', { pageSize: 101 }, 'pageSize'],
    ['page is 0', { page: 0 }, 'page'],
    ['page is not a number', { page: 'abc' }, 'page'],
    ['sortBy is unknown', { sortBy: 'bogus' }, 'sortBy'],
    ['sortOrder is unknown', { sortOrder: 'sideways' }, 'sortOrder'],
    ['status is unknown', { status: 'bogus' }, 'status'],
    ['platform is unknown', { platform: 'xbox' }, 'platform'],
  ])('returns 400 when %s', async (_case, params, field) => {
    const res = await list<{ issues: Record<string, string[]> }>(params);

    expect(res.status).toBe(400);
    expect(res.data.issues[field]).toBeDefined();
    expect(Object.keys(res.data.issues)).toEqual([field]);
  });
});
