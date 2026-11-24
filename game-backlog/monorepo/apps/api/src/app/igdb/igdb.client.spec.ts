import {
  IgdbClient,
  IgdbNotConfiguredError,
  IgdbRequestError,
} from './igdb.client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const tokenResponse = (token: string, expiresIn = 5_000_000) =>
  json({ access_token: token, expires_in: expiresIn, token_type: 'bearer' });

const isTokenCall = (input: unknown) =>
  String(input).startsWith('https://id.twitch.tv/');

const fetchMock = vi.spyOn(globalThis, 'fetch');

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubEnv('IGDB_CLIENT_ID', 'client-id');
  vi.stubEnv('IGDB_CLIENT_SECRET', 'client-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('IgdbClient', () => {
  it('throws IgdbNotConfiguredError without credentials, before any request', async () => {
    vi.stubEnv('IGDB_CLIENT_SECRET', '');
    await expect(
      new IgdbClient().query('games', 'fields name;'),
    ).rejects.toBeInstanceOf(IgdbNotConfiguredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gets a token, then posts the query with Client-ID and Bearer headers', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('tok-1'))
      .mockResolvedValueOnce(json([{ id: 1, name: 'Hollow Knight' }]));

    const result = await new IgdbClient().query(
      'games',
      'search "hollow"; fields name;',
    );

    expect(result).toEqual([{ id: 1, name: 'Hollow Knight' }]);
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://id.twitch.tv/oauth2/token');
    // Secret goes in the form body, never the URL.
    expect(String(tokenUrl)).not.toContain('client-secret');
    expect(String(tokenInit?.body)).toContain('grant_type=client_credentials');

    const [apiUrl, apiInit] = fetchMock.mock.calls[1];
    expect(apiUrl).toBe('https://api.igdb.com/v4/games');
    expect(apiInit?.body).toBe('search "hollow"; fields name;');
    expect(apiInit?.headers).toMatchObject({
      'Client-ID': 'client-id',
      Authorization: 'Bearer tok-1',
    });
  });

  it('reuses the cached token across queries', async () => {
    fetchMock.mockImplementation(async (input) =>
      isTokenCall(input) ? tokenResponse('tok-1') : json([]),
    );
    const client = new IgdbClient();

    await client.query('games', 'a');
    await client.query('games', 'b');

    expect(fetchMock.mock.calls.filter(([u]) => isTokenCall(u))).toHaveLength(
      1,
    );
  });

  it('shares one token request between concurrent queries', async () => {
    fetchMock.mockImplementation(async (input) =>
      isTokenCall(input) ? tokenResponse('tok-1') : json([]),
    );
    const client = new IgdbClient();

    await Promise.all([client.query('games', 'a'), client.query('games', 'b')]);

    expect(fetchMock.mock.calls.filter(([u]) => isTokenCall(u))).toHaveLength(
      1,
    );
  });

  it('renews the token once it is about to expire', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    let n = 0;
    fetchMock.mockImplementation(async (input) =>
      isTokenCall(input) ? tokenResponse(`tok-${++n}`, 3600) : json([]),
    );
    const client = new IgdbClient();

    await client.query('games', 'a');
    vi.setSystemTime(Date.now() + 3600 * 1000); // past expiry minus the margin
    await client.query('games', 'b');

    const auth = fetchMock.mock.calls
      .filter(([u]) => !isTokenCall(u))
      .map(
        ([, init]) => (init?.headers as Record<string, string>).Authorization,
      );
    expect(auth).toEqual(['Bearer tok-1', 'Bearer tok-2']);
  });

  it('drops the token and retries once on 401', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('stale'))
      .mockResolvedValueOnce(json({ message: 'Authorization Failure' }, 401))
      .mockResolvedValueOnce(tokenResponse('fresh'))
      .mockResolvedValueOnce(json([{ id: 2 }]));

    await expect(new IgdbClient().query('games', 'a')).resolves.toEqual([
      { id: 2 },
    ]);
    expect(
      (fetchMock.mock.calls[3][1]?.headers as Record<string, string>)
        .Authorization,
    ).toBe('Bearer fresh');
  });

  it('throws IgdbRequestError with the status on a non-2xx answer', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce(json({ message: 'Too Many Requests' }, 429));

    await expect(new IgdbClient().query('games', 'a')).rejects.toMatchObject({
      name: 'IgdbRequestError',
      status: 429,
    });
  });

  it('wraps network failures and timeouts in IgdbRequestError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    const err = (await new IgdbClient()
      .query('games', 'a')
      .catch((e: unknown) => e)) as Error;
    expect(err).toBeInstanceOf(IgdbRequestError);
    expect(err.message).toContain('id.twitch.tv');
    expect(err.message).not.toContain('client-secret');
  });

  it('fails when Twitch rejects the credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      json({ message: 'invalid client secret' }, 403),
    );

    await expect(new IgdbClient().query('games', 'a')).rejects.toMatchObject({
      status: 403,
    });
  });
});
