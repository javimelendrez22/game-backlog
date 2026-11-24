import type { ReactNode } from 'react';
import {
  PLATFORM_LABELS,
  platformSchema,
  type GameStatus,
  type Platform,
} from '@org/contracts';
import { STATUS_META, STATUSES } from '../../lib/game-display';

// Full class names are spelled out so Tailwind's scanner picks them up.
const STATUS_BORDER: Record<GameStatus, string> = {
  wishlist: 'border-status-wishlist',
  backlog: 'border-status-backlog',
  playing: 'border-status-playing',
  completed: 'border-status-completed',
  dropped: 'border-status-dropped',
};

const STATUS_HINTS: Record<GameStatus, string> = {
  playing: "You're in the middle of it",
  backlog: 'Owned, not started yet',
  completed: 'Credits rolled',
  wishlist: 'You want to get it',
  dropped: 'Put it down for good',
};

function Group({
  legend,
  hint,
  error,
  errorId,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0"
    >
      <legend className="p-0 pb-2.5 text-sm font-semibold">
        {legend}
        {hint && <span className="font-normal text-ink-muted"> · {hint}</span>}
      </legend>
      {children}
      {error && (
        <p id={errorId} className="m-0 text-[13px] text-status-wishlist">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const chip = (on: boolean) =>
  `min-h-11 rounded-full border px-[18px] text-sm font-medium transition-colors ${
    on
      ? 'border-[#6b7385] bg-selected text-ink'
      : 'border-border bg-transparent text-ink-soft hover:text-ink'
  }`;

export function StatusPicker({
  value,
  onChange,
}: {
  value: GameStatus;
  onChange: (status: GameStatus) => void;
}) {
  return (
    <Group legend="Where is it on your shelf?">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {STATUSES.map((s) => {
          const on = s === value;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(s)}
              className={`flex min-h-[76px] flex-col items-start justify-center gap-1 rounded-[14px] border-2 px-4 py-3.5 text-left text-ink ${
                on
                  ? `${STATUS_BORDER[s]} bg-nav-selected`
                  : 'border-border bg-surface-sunken'
              }`}
            >
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold">
                <span
                  aria-hidden="true"
                  className={`size-2 ${STATUS_META[s].dotClass}`}
                />
                {STATUS_META[s].label}
              </span>
              <span className="text-[13px] text-ink-muted">
                {STATUS_HINTS[s]}
              </span>
            </button>
          );
        })}
      </div>
    </Group>
  );
}

export function PlatformPicker({
  value,
  onChange,
  error,
}: {
  value: Platform[];
  onChange: (platforms: Platform[]) => void;
  error?: string;
}) {
  const toggle = (p: Platform) =>
    onChange(
      value.includes(p)
        ? value.filter((v) => v !== p)
        : // Keep the enum's order, so the saved list doesn't depend on click order.
          platformSchema.options.filter((o) => o === p || value.includes(o)),
    );

  return (
    <Group
      legend="Platform"
      hint="pick all you own it on"
      error={error}
      errorId="platforms-error"
    >
      <div className="flex flex-wrap gap-2">
        {platformSchema.options.map((p) => {
          const on = value.includes(p);
          return (
            <button
              key={p}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(p)}
              className={chip(on)}
            >
              {PLATFORM_LABELS[p]}
            </button>
          );
        })}
      </div>
    </Group>
  );
}

export function RatingPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
}) {
  return (
    <Group legend="Your rating" hint="optional, press again to clear">
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const on = n === value;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              aria-label={`${n} out of 10`}
              onClick={() => onChange(on ? null : n)}
              className={`size-11 rounded-xl border text-[15px] font-semibold transition-colors ${
                on
                  ? 'border-accent bg-accent text-on-accent'
                  : 'border-border bg-surface-sunken text-ink-soft hover:text-ink'
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </Group>
  );
}
