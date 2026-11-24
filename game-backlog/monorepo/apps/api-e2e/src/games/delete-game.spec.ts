import { randomUUID } from 'node:crypto';
import axios from 'axios';
import type { CreateGameInput, Game } from '@org/contracts';

// Return every status as a normal response so 4xx can be asserted directly.
const del = <T = unknown>(id: string) =>
  axios.delete<T>(`/api/games/${id}`, { validateStatus: () => true });
const get = (id: string) =>
  axios.get(`/api/games/${id}`, { validateStatus: () => true });

describe('DELETE /api/games/:id', () => {
  it('deletes the game and responds 204 with no body', async () => {
    const body: CreateGameInput = {
      title: 'Game To Delete',
      platforms: ['pc'],
    };
    const { data: created } = await axios.post<Game>('/api/games', body);

    const res = await del(created.id);

    expect(res.status).toBe(204);
    expect(res.data).toBe('');
    expect((await get(created.id)).status).toBe(404);
  });

  it('responds 204 again when the game is already gone', async () => {
    const { data: created } = await axios.post<Game>('/api/games', {
      title: 'Deleted Twice',
      platforms: ['pc'],
    } satisfies CreateGameInput);

    expect((await del(created.id)).status).toBe(204);
    expect((await del(created.id)).status).toBe(204);
  });

  it('responds 204 for a well-formed id that never existed', async () => {
    const res = await del(randomUUID());

    expect(res.status).toBe(204);
  });

  it('returns 400 with an id issue when the id is not a uuid', async () => {
    const res = await del<{ issues: Record<string, string[]> }>('not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.data.issues.id).toBeDefined();
  });

  it('leaves other games untouched', async () => {
    const { data: keep } = await axios.post<Game>('/api/games', {
      title: 'Keep Me',
      platforms: ['pc'],
    } satisfies CreateGameInput);

    await del(randomUUID());

    expect((await get(keep.id)).status).toBe(200);
  });
});
