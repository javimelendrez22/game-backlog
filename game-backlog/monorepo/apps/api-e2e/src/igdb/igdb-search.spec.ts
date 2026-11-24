import axios from 'axios';

// Only input validation is tested here: it never reaches IGDB, so it doesn't
// depend on credentials or the network. The mapping and error handling are
// unit-tested in apps/api/src/app/igdb.
describe('GET /api/igdb/search', () => {
  it.each([
    ['missing', {}],
    ['blank after trimming', { search: '   ' }],
    ['too short', { search: 'a' }],
    ['too long', { search: 'x'.repeat(101) }],
  ])('returns 400 when the search is %s', async (_case, params) => {
    await expect(
      axios.get('/api/igdb/search', { params }),
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: { issues: { search: expect.any(Array) } },
      },
    });
  });
});
