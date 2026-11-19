import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLATFORM_LABELS, type GameStatus } from '@org/contracts';
import { useGames } from '../api/games';
import { STATUS_META, STATUSES } from '../lib/game-display';
import { useLibraryFilters } from '../lib/library-filters';
import { LinkButton } from '../ui/Button';
import { PlusIcon, SearchIcon } from '../ui/icons';
import { PageHeader, SectionHeading } from '../ui/PageHeader';
import { SegmentedControl } from '../ui/SegmentedControl';
import { GameCard, GameCardSkeleton, NowPlayingCard } from './library/GameCard';

type Tab = GameStatus | 'all';

const TABS = [
  { value: 'all', label: 'All' },
  ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
] as const satisfies readonly { value: Tab; label: string }[];

function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  // Local state keeps typing snappy; the URL updates after a short pause.
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), 250);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  return (
    <div className="box-border flex h-11 w-[280px] max-w-full items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-ink-muted focus-within:border-border-strong">
      <SearchIcon />
      <label htmlFor="library-search" className="sr-only">
        Search your games
      </label>
      <input
        id="library-search"
        type="search"
        placeholder="Search your games"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
      />
    </div>
  );
}

function NowPlaying() {
  const { data } = useGames({ status: 'playing', pageSize: 6 });
  const games = data?.items ?? [];
  if (games.length === 0) return null;
  const maxHours = Math.max(1, ...games.map((g) => g.hoursPlayed ?? 0));

  return (
    <section aria-labelledby="now-playing" className="flex flex-col gap-4">
      <SectionHeading id="now-playing">Now playing</SectionHeading>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
        {games.map((g) => (
          <NowPlayingCard
            key={g.id}
            game={g}
            progress={(g.hoursPlayed ?? 0) / maxHours}
          />
        ))}
      </div>
    </section>
  );
}

export function LibraryPage() {
  const { filters, setFilter } = useLibraryFilters();
  const { status, platform, search } = filters;
  const { data, isPending, isError, refetch } = useGames({
    status,
    platform,
    search,
    pageSize: 60,
  });

  const heading = [
    status ? STATUS_META[status].label : 'Library',
    platform && `on ${PLATFORM_LABELS[platform]}`,
  ]
    .filter(Boolean)
    .join(' ');

  const total = data?.meta.total;
  const summary =
    total === undefined
      ? ' '
      : `${total} ${total === 1 ? 'game' : 'games'}${search ? ` matching “${search}”` : ''}`;

  const games = data?.items ?? [];
  const showNowPlaying = !status && !platform && !search;

  return (
    <>
      <PageHeader
        title={heading}
        summary={summary}
        actions={
          <>
            <SearchBox
              value={search ?? ''}
              onChange={(v) => setFilter('search', v)}
            />
            <LinkButton to="/games/new">
              <PlusIcon />
              Add game
            </LinkButton>
          </>
        }
      />

      {showNowPlaying && <NowPlaying />}

      <section aria-labelledby="your-games" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading id="your-games">Your games</SectionHeading>
          <SegmentedControl<Tab>
            label="Filter by status"
            options={TABS}
            value={status ?? 'all'}
            onChange={(v) => setFilter('status', v === 'all' ? undefined : v)}
          />
        </div>

        {isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-[15px] text-ink-muted"
          >
            Couldn’t load your games.{' '}
            <button
              type="button"
              onClick={() => refetch()}
              className="border-0 bg-transparent p-0 font-semibold text-accent underline hover:text-accent-hover"
            >
              Try again
            </button>
          </div>
        ) : !isPending && games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-[15px] text-ink-muted">
            No games match. Try another filter, or{' '}
            <Link to="/games/new">add a game</Link>.
          </div>
        ) : (
          <div
            aria-busy={isPending}
            className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-5 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
          >
            {isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <GameCardSkeleton key={i} />
                ))
              : games.map((g) => <GameCard key={g.id} game={g} />)}
          </div>
        )}
      </section>
    </>
  );
}
