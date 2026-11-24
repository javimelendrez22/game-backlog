import axios from 'axios';
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
  list: (filter: GamesFilter) => ['games', 'list', filter] as const,
};

export function useGames(filter: GamesFilter = {}) {
  return useQuery({
    queryKey: gamesKeys.list(filter),
    queryFn: () => listGames(filter),
    placeholderData: keepPreviousData,
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
