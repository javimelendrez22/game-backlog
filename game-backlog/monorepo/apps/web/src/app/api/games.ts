import axios, { isAxiosError } from 'axios';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  gameListResponseSchema,
  gameSchema,
  type CreateGameInput,
  type Game,
  type GameListResponse,
  type GameStatus,
  type Platform,
} from '@org/contracts';

export const api = axios.create({ baseURL: '/api' });

/** Filters the web app sends to GET /api/games (all optional). */
export interface GamesFilter {
  status?: GameStatus;
  platform?: Platform;
  search?: string;
  pageSize?: number;
}

export async function listGames(
  filter: GamesFilter = {},
): Promise<GameListResponse> {
  const params = Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== ''),
  );
  const { data } = await api.get('/games', { params });
  return gameListResponseSchema.parse(data);
}

export const gamesKeys = {
  all: ['games'] as const,
  lists: ['games', 'list'] as const,
  list: (filter: GamesFilter) => ['games', 'list', filter] as const,
  detail: (id: string) => ['games', 'detail', id] as const,
};

export function useGames(filter: GamesFilter = {}) {
  return useQuery({
    queryKey: gamesKeys.list(filter),
    queryFn: () => listGames(filter),
    placeholderData: keepPreviousData,
  });
}

export async function getGame(id: string): Promise<Game> {
  const { data } = await api.get(`/games/${id}`);
  return gameSchema.parse(data);
}

/** True for an axios error the API answered with 404. */
export function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/**
 * GET /api/games/:id. Coming from the library, the game is usually already in a
 * cached list page, so that copy shows at once while the fresh one loads.
 */
export function useGame(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: gamesKeys.detail(id),
    queryFn: () => getGame(id),
    placeholderData: () => {
      for (const [, page] of queryClient.getQueriesData<GameListResponse>({
        queryKey: gamesKeys.lists,
      })) {
        const hit = page?.items.find((g) => g.id === id);
        if (hit) return hit;
      }
      return undefined;
    },
    // A missing game stays missing; only retry other failures.
    retry: (count, error) => !isNotFound(error) && count < 1,
  });
}

export async function createGame(input: CreateGameInput): Promise<Game> {
  const { data } = await api.post('/games', input);
  return gameSchema.parse(data);
}

/** POST /api/games, then refetch every games list so the new game shows up. */
export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gamesKeys.all }),
  });
}

export async function deleteGame(id: string): Promise<void> {
  await api.delete(`/games/${id}`);
}

/**
 * DELETE /api/games/:id. On success the game's detail cache is dropped (so it
 * can't flash back as placeholder data) and every list refetches without it.
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGame,
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: gamesKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: gamesKeys.lists });
    },
  });
}
