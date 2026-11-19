import type { GameStatus } from '@org/contracts';
import { STATUS_META } from '../lib/game-display';

export function StatusDot({ status }: { status: GameStatus }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-[7px] shrink-0 ${STATUS_META[status].dotClass}`}
    />
  );
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: GameStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${meta.textClass} ${className}`}
    >
      <StatusDot status={status} />
      {meta.label}
    </span>
  );
}
