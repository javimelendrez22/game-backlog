import { fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Game, GameListResponse } from '@org/contracts';
import App from './app';
import { api } from './api/games';

const get = vi.spyOn(api, 'get');

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

beforeEach(() => {
  get.mockReset();
  get.mockImplementation(async (_url, config) => {
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
