import axios from 'axios';
import type { CreateGameInput, Game } from '@org/contracts';

describe('POST /api/games', () => {
  it('should return a APIs Game', async () => {
    const body: CreateGameInput = {
      title: 'The Legend of Zelda: Breath of the Wild',
      platforms: ['nintendo-switch'],
    };
    const res = await axios.post<Game>(`/api/games`, body);

    expect(res.status).toBe(201);
    expect(res.data).toEqual(expect.objectContaining({
      id: expect.any(String),
      title: 'The Legend of Zelda: Breath of the Wild',
      platforms: ['nintendo-switch'],
      genres: [],
      developer: null,
      publisher: null,
      releaseDate: null,
      coverImageUrl: null,
      status: 'backlog',
      rating: null,
      hoursPlayed: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }));
  });
  it('should return 400 if the request body is invalid', async () => {
    const body = {
      title: '',
      platforms: [],
    };
    await expect(axios.post('/api/games', body)).rejects.toMatchObject({
    response: { status: 400 },
    });
  });

  it('echoes back every field of a full body', async () => {
    const body: CreateGameInput = {
      igdbId: 201,
      title: 'Hollow Knight',
      platforms: ['pc', 'nintendo-switch'],
      genres: ['metroidvania', 'platformer'],
      developer: 'Team Cherry',
      publisher: 'Team Cherry',
      releaseDate: '2017-02-24',
      coverImageUrl: 'https://example.com/hollow-knight.jpg',
      status: 'completed',
      rating: 9,
      hoursPlayed: 42.5,
    };
    const res = await axios.post<Game>('/api/games', body);

    expect(res.status).toBe(201);
    // toEqual (not objectContaining): fails if the response gains or loses a field.
    expect(res.data).toEqual({
      ...body,
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      ),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(res.data.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(res.data.updatedAt))).toBe(false);
  });

  // One bad field per case, so each validation rule is pinned down on its own.
  it.each([
    ['title is missing', { platforms: ['pc'] }, 'title'],
    ['platforms is empty', { title: 'x', platforms: [] }, 'platforms'],
    ['rating is above 10', { title: 'x', platforms: ['pc'], rating: 11 }, 'rating'],
    ['platform is unknown', { title: 'x', platforms: ['xbox'] }, 'platforms'],
  ])('returns 400 when %s', async (_case, body, field) => {
    const res = await axios.post<{ issues: Record<string, string[]> }>(
      '/api/games',
      body,
      { validateStatus: () => true },
    );

    expect(res.status).toBe(400);
    expect(res.data.issues[field]).toBeDefined();
    // Only the broken field is reported.
    expect(Object.keys(res.data.issues)).toEqual([field]);
  });
});

describe('POST /api/games with igdbId', () => {
  // Return every status as a normal response so 4xx can be asserted directly.
  const post = <T = unknown>(body: unknown) =>
    axios.post<T>('/api/games', body, { validateStatus: () => true });

  it('stores and returns the igdbId', async () => {
    const body: CreateGameInput = {
      igdbId: 101,
      title: 'Imported Game',
      platforms: ['pc'],
    };
    const res = await post<Game>(body);

    expect(res.status).toBe(201);
    expect(res.data.igdbId).toBe(101);
  });

  it('returns 409 when the same igdbId is imported twice', async () => {
    const body: CreateGameInput = {
      igdbId: 102,
      title: 'Imported Twice',
      platforms: ['pc'],
    };
    const first = await post<Game>(body);
    const second = await post(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.data).toMatchObject({
      message: 'Game is already in the backlog',
      igdbId: 102,
    });
  });

  it('allows any number of games without an igdbId', async () => {
    const body: CreateGameInput = { title: 'Added By Hand', platforms: ['pc'] };
    const first = await post<Game>(body);
    const second = await post<Game>(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.data.igdbId).toBeNull();
    expect(second.data.igdbId).toBeNull();
    expect(first.data.id).not.toBe(second.data.id);
  });

  it.each([0, 1.5, 'abc'])('returns 400 for igdbId %p', async (igdbId) => {
    const res = await post<{ issues: Record<string, string[]> }>({
      igdbId,
      title: 'Bad Id',
      platforms: ['pc'],
    });

    expect(res.status).toBe(400);
    expect(res.data.issues.igdbId).toBeDefined();
  });
});