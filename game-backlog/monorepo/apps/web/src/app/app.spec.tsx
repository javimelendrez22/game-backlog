import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type {
  Game,
  GameListResponse,
  IgdbSearchResponse,
} from '@org/contracts';
import App from './app';
import { api } from './api/games';

const get = vi.spyOn(api, 'get');
const post = vi.spyOn(api, 'post');

const game = (over: Partial<Game>): Game => ({
  id: '00000000-0000-4000-8000-000000000001',
  igdbId: null,
  title: 'Ashen Circuit',
  platforms: ['pc'],
  genres: ['Action RPG'],
  developer: null,
  publisher: null,
  releaseDate: null,
  coverImageUrl: null,
  status: 'playing',
  rating: null,
  hoursPlayed: 32,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
  ...over,
});

const games = [
  game({}),
  game({
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Glass Orchard',
    status: 'backlog',
    hoursPlayed: null,
  }),
];

const page = (items: Game[]): GameListResponse => ({
  items,
  meta: { page: 1, pageSize: 60, total: items.length, totalPages: 1 },
});

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

function renderAt(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const igdbResults: IgdbSearchResponse = {
  items: [
    {
      igdbId: 52189,
      title: 'Grand Theft Auto VI',
      genres: ['Shooter', 'Adventure'],
      developer: 'Rockstar Games',
      publisher: 'Take-Two Interactive',
      releaseDate: '2026-11-19',
      coverImageUrl:
        'https://images.igdb.com/igdb/image/upload/t_cover_big/cocv1v.jpg',
    },
    {
      igdbId: 1020,
      title: 'Grand Theft Auto V',
      genres: [],
      developer: null,
      publisher: null,
      releaseDate: null,
      coverImageUrl: null,
    },
  ],
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  get.mockImplementation(async (url, config) => {
    if (url === '/igdb/search') return { data: igdbResults };
    const status = (config?.params as { status?: string } | undefined)?.status;
    return { data: page(games.filter((g) => !status || g.status === status)) };
  });
});

describe('App', () => {
  it('renders the library shell with sidebar navigation and games', async () => {
    renderAt('/');
    const collections = screen.getByRole('navigation', { name: 'Collections' });
    expect(
      within(collections)
        .getByRole('link', { name: /Library/ })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(
      within(collections).getByRole('link', { name: /Stats/ }),
    ).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Platforms' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Library' }),
    ).toBeTruthy();

    expect(await screen.findByText('Glass Orchard')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Now playing' })).toBeTruthy();
  });

  it('puts the status tab in the URL and refetches with it', async () => {
    renderAt('/');
    await screen.findByText('Glass Orchard');

    const tabs = screen.getByRole('group', { name: 'Filter by status' });
    fireEvent.click(within(tabs).getByRole('button', { name: 'Backlog' }));

    expect(screen.getByTestId('location').textContent).toBe('/?status=backlog');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Backlog' }),
    ).toBeTruthy();
    expect(get).toHaveBeenCalledWith('/games', {
      params: expect.objectContaining({ status: 'backlog' }),
    });
  });

  it('shows the stats page without the sidebar and links back', () => {
    renderAt('/stats');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Stats' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('navigation', { name: 'Collections' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Back to library' }));
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('shows an empty state when nothing matches', async () => {
    get.mockResolvedValue({ data: page([]) });
    renderAt('/?status=dropped');
    expect(await screen.findByText(/No games match/)).toBeTruthy();
  });
});

describe('AddGamePage', () => {
  async function pickGtaVi() {
    renderAt('/games/new');
    const title = screen.getByRole('combobox', { name: 'Title' });
    fireEvent.change(title, { target: { value: 'grand theft' } });
    fireEvent.click(
      await screen.findByRole('option', { name: /Grand Theft Auto VI/ }),
    );
    return title;
  }

  it('fills the form from an IGDB pick and posts it with the manual fields', async () => {
    post.mockImplementation(async (_url, body) => ({
      data: game({
        ...(body as Partial<Game>),
        id: '00000000-0000-4000-8000-000000000009',
      }),
    }));
    const title = await pickGtaVi();

    expect(get).toHaveBeenCalledWith('/igdb/search', {
      params: { search: 'grand theft' },
    });
    expect((title as HTMLInputElement).value).toBe('Grand Theft Auto VI');
    const match = screen.getByRole('region', { name: 'IGDB match' });
    expect(within(match).getByText('Rockstar Games')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Playing/ }));
    fireEvent.click(screen.getByRole('button', { name: 'PlayStation 5' }));
    fireEvent.click(screen.getByRole('button', { name: '9 out of 10' }));
    fireEvent.change(screen.getByLabelText('Hours played so far'), {
      target: { value: '12.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add to library' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/games', {
      igdbId: 52189,
      title: 'Grand Theft Auto VI',
      genres: ['Shooter', 'Adventure'],
      developer: 'Rockstar Games',
      publisher: 'Take-Two Interactive',
      releaseDate: '2026-11-19',
      coverImageUrl:
        'https://images.igdb.com/igdb/image/upload/t_cover_big/cocv1v.jpg',
      platforms: ['playstation-5'],
      status: 'playing',
      rating: 9,
      hoursPlayed: 12.5,
    });
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/'),
    );
  });

  it('saves a typed title as a manual game once "Not this game" clears the pick', async () => {
    post.mockResolvedValue({ data: game({}) });
    await pickGtaVi();

    fireEvent.click(screen.getByRole('button', { name: 'Not this game' }));
    fireEvent.click(screen.getByRole('button', { name: /Wishlist/ }));
    fireEvent.click(screen.getByRole('button', { name: 'PC' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({
      igdbId: null,
      title: 'Grand Theft Auto VI',
      genres: [],
      coverImageUrl: null,
      status: 'wishlist',
      rating: null,
      hoursPlayed: null,
    });
  });

  it('shows field errors instead of posting an incomplete game', async () => {
    renderAt('/games/new');
    fireEvent.click(screen.getByRole('button', { name: 'Add to library' }));

    expect(await screen.findByText('Enter a title')).toBeTruthy();
    expect(screen.getByText('Pick at least one platform')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();
  });

  it('says so when the game is already in the library (409)', async () => {
    post.mockRejectedValue(
      new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'Game is already in the backlog' },
        headers: {},
        config: { headers: new AxiosHeaders() },
      }),
    );
    await pickGtaVi();
    fireEvent.click(screen.getByRole('button', { name: 'PC' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to library' }));

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Grand Theft Auto VI is already in your library.',
    );
    expect(screen.getByTestId('location').textContent).toBe('/games/new');
  });

  it('tells the user when IGDB search is not set up (503)', async () => {
    get.mockImplementation(async (url) => {
      if (url === '/igdb/search') {
        throw new AxiosError(
          'Unavailable',
          'ERR_BAD_RESPONSE',
          undefined,
          undefined,
          {
            status: 503,
            statusText: 'Service Unavailable',
            data: {},
            headers: {},
            config: { headers: new AxiosHeaders() },
          },
        );
      }
      return { data: page([]) };
    });
    renderAt('/games/new');
    fireEvent.change(screen.getByRole('combobox', { name: 'Title' }), {
      target: { value: 'hades' },
    });

    expect(await screen.findByText(/IGDB search isn't set up/)).toBeTruthy();
  });
});
