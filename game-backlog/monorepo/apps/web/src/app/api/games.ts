import axios from 'axios';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  gameListResponseSchema,
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
