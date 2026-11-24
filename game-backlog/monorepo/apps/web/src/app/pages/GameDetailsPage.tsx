import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PLATFORM_LABELS, type Game } from '@org/contracts';
import { isNotFound, useGame } from '../api/games';
import { FocusActions } from '../layouts/FocusLayout';
import { formatDate, formatHours } from '../lib/game-display';
import { Button } from '../ui/Button';
import { GameCover } from '../ui/GameCover';
import { TrashIcon } from '../ui/icons';
import { PageHeader } from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';
import { DeleteGameDialog } from './game-details/DeleteGameDialog';

const card = 'rounded-[14px] border border-border bg-surface';
const label = 'text-[13px] text-ink-muted';

function StatCard({
  title,
  value,
  className = '',
  children,
}: {
  title: string;
  value: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-3 p-[18px] ${card} ${className}`}
    >
      <span className={label}>{title}</span>
      <span className="font-display text-[32px] font-semibold leading-none">
        {value}
      </span>
      {children}
    </div>
  );
}

/** Ten segments filled up to the rating. The number above already says it. */
function RatingBar({ rating }: { rating: number | null }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-10 gap-1">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 rounded-[3px] ${
            rating !== null && i < rating
              ? 'bg-status-completed'
              : 'bg-border'
          }`}
        />
      ))}
    </div>
  );
}

function Chip({
  variant,
  children,
}: {
  variant: 'outline' | 'filled';
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex h-[30px] items-center rounded-lg px-3 text-sm ${
        variant === 'outline'
          ? 'border border-border-strong font-semibold'
          : 'bg-nav-selected text-ink-soft'
      }`}
    >
      {children}
    </span>
  );
}

function Hero({ game }: { game: Game }) {
  const year = game.releaseDate?.slice(0, 4);
  const byline = [game.developer, year].filter(Boolean).join(' · ');

  return (
    <section className="flex flex-wrap items-start gap-10">
      <div className="flex-[0_1_280px]">
        <GameCover game={game} size="lg" />
      </div>

      <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={game.status} className="text-sm" />
            <span className="inline-flex h-6 items-center rounded-md bg-nav-selected px-2 text-xs font-semibold tracking-[0.04em] text-ink-soft">
              {game.igdbId ? `IGDB #${game.igdbId}` : 'Added by hand'}
            </span>
          </div>
          <h1 className="m-0 font-display text-[40px] font-bold uppercase leading-none tracking-[0.01em] sm:text-[52px]">
            {game.title}
          </h1>
          <p className="m-0 text-base text-ink-muted">
            {byline || 'No developer or release date yet'}
          </p>
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((p) => (
              <Chip key={p} variant="outline">
                {PLATFORM_LABELS[p]}
              </Chip>
            ))}
            {game.genres.length > 0 ? (
              game.genres.map((g) => (
                <Chip key={g} variant="filled">
                  {g}
                </Chip>
              ))
            ) : (
              <Chip variant="filled">No genres</Chip>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard
            title="Your rating"
            value={game.rating !== null ? `${game.rating} / 10` : 'Not rated'}
            className="flex-[2_1_340px]"
          >
            <RatingBar rating={game.rating} />
          </StatCard>
          <StatCard
            title="Hours played"
            value={
              game.hoursPlayed !== null
                ? formatHours(game.hoursPlayed)
                : 'Not tracked'
            }
            className="flex-[1_1_200px]"
          />
        </div>
      </div>
    </section>
  );
}

function Details({ game }: { game: Game }) {
  const facts: [string, string | null][] = [
    ['Developer', game.developer],
    ['Publisher', game.publisher],
    ['Release date', game.releaseDate && formatDate(game.releaseDate)],
    ['Platforms', game.platforms.map((p) => PLATFORM_LABELS[p]).join(', ')],
    ['Genres', game.genres.join(', ') || null],
    ['IGDB id', game.igdbId ? String(game.igdbId) : null],
  ];

  return (
    <section
      aria-labelledby="details-heading"
      className="flex flex-col gap-2 rounded-[18px] border border-border bg-surface p-6"
    >
      <h2
        id="details-heading"
        className="m-0 mb-2 font-display text-[22px] font-semibold uppercase tracking-[0.01em]"
      >
        Details
      </h2>
      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-x-8">
        {facts.map(([term, value]) => (
          <div
            key={term}
            className="flex flex-col gap-1 border-b border-border-subtle py-3.5"
          >
            <dt className={label}>{term}</dt>
            <dd
              className={`m-0 text-base font-medium ${value ? 'text-ink' : 'text-ink-muted'}`}
            >
              {value ?? 'Unknown'}
            </dd>
          </div>
        ))}
      </dl>
      <p className={`m-0 mt-2 ${label}`}>
        Added {formatDate(game.createdAt)} · Last updated{' '}
        {formatDate(game.updatedAt)}
      </p>
    </section>
  );
}

function DeleteGameAction({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <FocusActions>
        <Button
          variant="danger-outline"
          className="px-4"
          onClick={() => setOpen(true)}
        >
          <TrashIcon />
          Delete game
        </Button>
      </FocusActions>
      <DeleteGameDialog game={game} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DetailsSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-wrap items-start gap-10"
    >
      <div className="aspect-[3/4] flex-[0_1_280px] rounded-[18px] bg-nav-selected" />
      <div className="flex flex-[999_1_420px] flex-col gap-4">
        <div className="h-5 w-32 rounded bg-nav-selected" />
        <div className="h-12 w-3/4 rounded bg-nav-selected" />
        <div className="h-4 w-1/3 rounded bg-nav-selected" />
      </div>
    </div>
  );
}

export function GameDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: game, isPending, error, refetch } = useGame(id);

  if (game) {
    return (
      <>
        <DeleteGameAction game={game} />
        <Hero game={game} />
        <Details game={game} />
      </>
    );
  }

  if (isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Loading game</span>
        <DetailsSkeleton />
      </div>
    );
  }

  if (isNotFound(error)) {
    return (
      <PageHeader
        title="Game not found"
        summary={
          <>
            It may have been removed from your library.{' '}
            <Link to="/">Go to your library</Link>.
          </>
        }
      />
    );
  }

  return (
    <div
      role="alert"
      className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-[15px] text-ink-muted"
    >
      Couldn’t load this game.{' '}
      <button
        type="button"
        onClick={() => refetch()}
        className="border-0 bg-transparent p-0 font-semibold text-accent underline hover:text-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}
