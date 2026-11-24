import { Link } from 'react-router-dom';
import type { Game } from '@org/contracts';
import { metaLine, platformLine } from '../../lib/game-display';
import { GameCover } from '../../ui/GameCover';
import { StatusBadge } from '../../ui/StatusBadge';

const cardClass =
  'rounded-2xl border border-border bg-surface text-ink no-underline transition-colors hover:border-border-strong hover:text-ink';

export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      to={`/games/${game.id}`}
      className={`flex flex-col gap-3 px-2.5 pt-2.5 pb-3.5 ${cardClass}`}
    >
      <GameCover game={game} />
      <div className="flex flex-col gap-0.5 px-1">
        <span className="text-[15px] font-semibold">{game.title}</span>
        <span className="text-[13px] text-ink-muted">{platformLine(game)}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 px-1 text-[13px]">
        <StatusBadge status={game.status} />
        <span className="text-ink-muted">{metaLine(game)}</span>
      </div>
    </Link>
  );
}

/** Wide card for the "Now playing" row. `progress` is 0–1 relative to the most-played game. */
export function NowPlayingCard({
  game,
  progress,
}: {
  game: Game;
  progress: number;
}) {
  const subtitle = [platformLine(game), game.genres[0]]
    .filter(Boolean)
    .join(' · ');
  return (
    <Link to={`/games/${game.id}`} className={`flex gap-4 p-3.5 ${cardClass}`}>
      <div className="w-[76px] flex-none">
        <GameCover game={game} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-semibold">{game.title}</span>
          <span className="text-[13px] text-ink-muted">{subtitle}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] text-ink-muted">{metaLine(game)}</span>
          <div
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-[3px] bg-border"
          >
            <div
              className="h-1.5 rounded-[3px] bg-accent"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function GameCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border bg-surface px-2.5 pt-2.5 pb-3.5"
    >
      <div className="aspect-[3/4] rounded-[11px] bg-nav-selected" />
      <div className="mx-1 h-4 w-3/4 rounded bg-nav-selected" />
      <div className="mx-1 h-3 w-1/2 rounded bg-nav-selected" />
    </div>
  );
}
