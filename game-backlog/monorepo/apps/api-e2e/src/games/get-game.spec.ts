import { randomUUID } from 'node:crypto';
import axios from 'axios';
import type { CreateGameInput, Game } from '@org/contracts';

// Return every status as a normal response so 4xx can be asserted directly.
const get = <T = unknown>(id: string) =>
  axios.get<T>(`/api/games/${id}`, { validateStatus: () => true });

describe('GET /api/games/:id', () => {
  it('returns the game exactly as it was created', async () => {
    const body: CreateGameInput = {
      igdbId: 301,
      title: 'Details Page Game',
      platforms: ['pc', 'playstation-5'],
      genres: ['Action RPG'],
      developer: 'Northlight Forge',
      releaseDate: '2025-09-18',
      status: 'playing',
      rating: 8,
      hoursPlayed: 32,
    };
    const { data: created } = await axios.post<Game>('/api/games', body);

    const res = await get<Game>(created.id);

    expect(res.status).toBe(200);
    expect(res.data).toEqual(created);
  });

  it('returns 404 for a well-formed id that matches no game', async () => {
    const id = randomUUID();
    const res = await get(id);

    expect(res.status).toBe(404);
    expect(res.data).toMatchObject({ message: 'Game not found', id });
  });

  it('returns 400 with an id issue when the id is not a uuid', async () => {
    const res = await get<{ issues: Record<string, string[]> }>('not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.data.issues.id).toBeDefined();
  });
});
