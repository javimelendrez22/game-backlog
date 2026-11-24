import { parseIgdbGame, toIgdbSearchResult } from './igdb.mapper';

// Trimmed from a real IGDB /games response for "Grand Theft Auto VI".
const gtaVi = {
  id: 52189,
  name: 'Grand Theft Auto VI',
  first_release_date: 1795046400,
  cover: { id: 600115, image_id: 'cocv1v' },
  genres: [
    { id: 5, name: 'Shooter' },
    { id: 10, name: 'Racing' },
    { id: 31, name: 'Adventure' },
  ],
  involved_companies: [
    {
      id: 395776,
      company: { id: 139, name: 'Take-Two Interactive' },
      developer: false,
      publisher: true,
    },
    {
      id: 395775,
      company: { id: 29, name: 'Rockstar Games' },
      developer: true,
      publisher: true,
    },
    {
      id: 423819,
      company: { id: 365, name: 'Rockstar North' },
      developer: true,
      publisher: false,
    },
  ],
};

describe('igdb mapper', () => {
  it('maps a full IGDB game onto a search result', () => {
    expect(toIgdbSearchResult(gtaVi)).toEqual({
      igdbId: 52189,
      title: 'Grand Theft Auto VI',
      genres: ['Shooter', 'Racing', 'Adventure'],
      developer: 'Rockstar Games',
      publisher: 'Take-Two Interactive',
      releaseDate: '2026-11-19',
      coverImageUrl:
        'https://images.igdb.com/igdb/image/upload/t_cover_big/cocv1v.jpg',
    });
  });

  it('turns fields IGDB left out into null or []', () => {
    expect(parseIgdbGame({ id: 7, name: 'Bare Game' })).toEqual({
      igdbId: 7,
      title: 'Bare Game',
      genres: [],
      developer: null,
      publisher: null,
      releaseDate: null,
      coverImageUrl: null,
    });
  });

  it('skips companies with no name and dedupes genres', () => {
    const result = parseIgdbGame({
      id: 8,
      name: 'Odd Game',
      genres: [{ name: 'RPG' }, { name: 'RPG' }],
      involved_companies: [
        { developer: true },
        { developer: true, company: { name: 'Studio' } },
      ],
    });
    expect(result?.genres).toEqual(['RPG']);
    expect(result?.developer).toBe('Studio');
    expect(result?.publisher).toBeNull();
  });

  it('returns null for an item that is not a game', () => {
    expect(parseIgdbGame({ id: 'nope', name: 'x' })).toBeNull();
    expect(parseIgdbGame({ id: 9 })).toBeNull();
    expect(parseIgdbGame(null)).toBeNull();
  });
});
