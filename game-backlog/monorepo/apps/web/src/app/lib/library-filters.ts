import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { platformSchema, type GameStatus, type Platform } from '@org/contracts';
import { isGameStatus } from './game-display';

export interface LibraryFilters {
  status?: GameStatus;
  platform?: Platform;
  search?: string;
}

type FilterKey = keyof LibraryFilters;

/** Reads library filters from a query string, dropping unknown values. */
export function parseLibraryFilters(params: URLSearchParams): LibraryFilters {
  const status = params.get('status');
  const platform = platformSchema.safeParse(params.get('platform'));
  const search = params.get('search')?.trim();
  return {
    status: isGameStatus(status) ? status : undefined,
    platform: platform.success ? platform.data : undefined,
    search: search || undefined,
  };
}

/** Query string for the library with one filter changed (undefined removes it). */
export function libraryHref(
  current: URLSearchParams,
  key: FilterKey,
  value: string | undefined,
): string {
  const next = new URLSearchParams(current);
  if (value) next.set(key, value);
  else next.delete(key);
  const qs = next.toString();
  return qs ? `/?${qs}` : '/';
}

/** Library filters live in the URL so the sidebar, tabs and search agree. */
export function useLibraryFilters() {
  const [params, setParams] = useSearchParams();
  const filters = parseLibraryFilters(params);

  const setFilter = useCallback(
    (key: FilterKey, value: string | undefined) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        // Typing in search shouldn't add a history entry per keystroke.
        { replace: key === 'search' },
      );
    },
    [setParams],
  );

  return { filters, params, setFilter };
}
