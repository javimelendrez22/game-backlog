import axios from 'axios';
describe('POST /api/games', () => {
  it('should return a APIs Game', async () => {
    const res = await axios.post(`/api/games`, {
        title: 'The Legend of Zelda: Breath of the Wild',
        platforms: ['nintendo-switch'],
      });

    expect(res.status).toBe(200);
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
});