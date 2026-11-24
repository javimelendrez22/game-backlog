import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  igdbSearchResponseSchema,
  type IgdbSearchResponse,
} from '@org/contracts';
import { api } from './games';

/** Shortest search the API accepts (matches `igdbSearchQuerySchema`). */
export const MIN_IGDB_SEARCH = 2;
const DEBOUNCE_MS = 350;

export async function searchIgdb(search: string): Promise<IgdbSearchResponse> {
  const { data } = await api.get('/igdb/search', { params: { search } });
  return igdbSearchResponseSchema.parse(data);
}

/** True when the API says IGDB credentials aren't set (503). */
export function isIgdbNotConfigured(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 503;
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * IGDB matches for what the user is typing. Waits for a pause in typing and
 * keeps every result for the session, so retyping a term never hits IGDB again.
 */
export function useIgdbSearch(input: string, enabled = true) {
  const search = useDebounced(input.trim(), DEBOUNCE_MS);
  const query = useQuery({
    queryKey: ['igdb', 'search', search.toLowerCase()],
    queryFn: () => searchIgdb(search),
    enabled: enabled && search.length >= MIN_IGDB_SEARCH,
    staleTime: Infinity,
    gcTime: Infinity,
    // A missing-credentials 503 won't fix itself on retry.
    retry: (count, error) => !isIgdbNotConfigured(error) && count < 1,
  });
  return {
    ...query,
    /** Input is ahead of the debounced search, or the request is in flight. */
    isPending:
      search.length >= MIN_IGDB_SEARCH &&
      (input.trim() !== search || query.isFetching),
  };
}
