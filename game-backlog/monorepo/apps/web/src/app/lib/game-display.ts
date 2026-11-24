import {
  gameStatusSchema,
  PLATFORM_LABELS,
  type Game,
  type GameStatus,
} from '@org/contracts';

export interface StatusMeta {
  label: string;
  /** Tailwind class for the status color square. */
  dotClass: string;
  /** Tailwind class for status-colored text. */
  textClass: string;
}

// Full class names are spelled out so Tailwind's scanner picks them up.
export const STATUS_META: Record<GameStatus, StatusMeta> = {
  wishlist: {
    label: 'Wishlist',
    dotClass: 'bg-status-wishlist',
    textClass: 'text-status-wishlist',
  },
  backlog: {
    label: 'Backlog',
    dotClass: 'bg-status-backlog',
    textClass: 'text-status-backlog',
  },
  playing: {
    label: 'Playing',
    dotClass: 'bg-status-playing',
    textClass: 'text-status-playing',
  },
  completed: {
    label: 'Completed',
    dotClass: 'bg-status-completed',
    textClass: 'text-status-completed',
  },
  dropped: {
    label: 'Dropped',
    dotClass: 'bg-status-dropped',
    textClass: 'text-status-dropped',
  },
};

/** Statuses in the order the UI lists them. */
export const STATUSES: readonly GameStatus[] = [
  'playing',
  'backlog',
  'completed',
  'wishlist',
  'dropped',
];

export function isGameStatus(value: unknown): value is GameStatus {
  return gameStatusSchema.safeParse(value).success;
}

/** Up to two initials for a cover tile: "Ember & Oak" -> "EO". */
export function initials(title: string): string {
  return title
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

/**
 * "Sep 18, 2025" from either a date ("2025-09-18") or a timestamp.
 * Date-only strings are read at noon UTC so no timezone shifts them a day.
 */
export function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Short secondary line on a game card, e.g. "32 h played" or "Not started". */
export function metaLine(game: Pick<Game, 'status' | 'hoursPlayed'>): string {
  const hours = game.hoursPlayed ?? 0;
  switch (game.status) {
    case 'wishlist':
      return 'Wanted';
    case 'completed':
      return hours > 0 ? `${formatHours(hours)} total` : 'Completed';
    case 'dropped':
      return hours > 0 ? `Dropped at ${formatHours(hours)}` : 'Dropped';
    default:
      return hours > 0 ? `${formatHours(hours)} played` : 'Not started';
  }
}

/** Platforms joined for display: "PC · PlayStation 5". */
export function platformLine(game: Pick<Game, 'platforms'>): string {
  return game.platforms.map((p) => PLATFORM_LABELS[p]).join(' · ');
}

const COVER_COLORS = [
  '#48356B',
  '#2F5D50',
  '#6B3B4A',
  '#3B5E6B',
  '#35486B',
  '#5B4A2F',
  '#6B5A3B',
  '#5D2F45',
  '#2F4F5D',
  '#4A6B3B',
] as const;

/** Stable fallback cover color for games without art, picked from the id. */
export function coverColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COVER_COLORS[hash % COVER_COLORS.length];
}
