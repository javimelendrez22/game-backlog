import type { Game } from '@org/contracts';
import { coverColor, initials } from '../lib/game-display';

/** Cover art, or a colored tile with the title's initials when there's no image. */
export function GameCover({
  game,
  size = 'md',
  className = '',
}: {
  game: Pick<Game, 'id' | 'title' | 'coverImageUrl'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const shape = {
    sm: 'rounded-[10px] p-2 text-[22px]',
    md: 'rounded-[11px] p-3.5 text-[40px]',
    lg: 'rounded-[18px] p-6 text-[72px]',
  }[size];

  if (game.coverImageUrl) {
    return (
      <img
        src={game.coverImageUrl}
        alt=""
        loading="lazy"
        className={`aspect-[3/4] w-full object-cover ${shape} ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{ backgroundColor: coverColor(game.id) }}
      className={`flex aspect-[3/4] w-full items-end font-display font-bold leading-none text-cover-ink ${shape} ${className}`}
    >
      {initials(game.title)}
    </div>
  );
}
