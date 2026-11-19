import type { ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { PLATFORM_LABELS, platformSchema } from '@org/contracts';
import { STATUS_META, STATUSES } from '../lib/game-display';
import { libraryHref, parseLibraryFilters } from '../lib/library-filters';
import { LogoIcon, StatsIcon } from '../ui/icons';

function NavHeading({ children }: { children: ReactNode }) {
  return (
    <span className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
      {children}
    </span>
  );
}

function navItemClass(active: boolean, size: 'lg' | 'sm' = 'lg') {
  return `flex items-center justify-between gap-2.5 rounded-[10px] px-3 no-underline transition-colors ${
    size === 'lg' ? 'min-h-11 text-[15px] font-medium' : 'min-h-10 text-sm'
  } ${
    active
      ? 'bg-nav-selected text-ink hover:text-ink'
      : 'text-ink-soft hover:bg-nav-selected/60 hover:text-ink'
  }`;
}

export function Sidebar() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const onLibrary = pathname === '/';
  const { status, platform } = parseLibraryFilters(params);

  return (
    <aside className="box-border flex flex-[1_1_240px] flex-col gap-8 border-r border-border-subtle bg-sidebar px-5 py-7">
      <Link
        to="/"
        className="flex items-center gap-2.5 px-2 text-ink no-underline hover:text-ink"
      >
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-accent text-bg">
          <LogoIcon />
        </span>
        <span className="font-display text-[22px] font-bold tracking-[-0.01em]">
          GameLibrary
        </span>
      </Link>

      <nav aria-label="Collections" className="flex flex-col gap-1">
        <NavHeading>Collections</NavHeading>
        <Link
          to={libraryHref(params, 'status', undefined)}
          aria-current={onLibrary && !status ? 'page' : undefined}
          className={navItemClass(onLibrary && !status)}
        >
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="size-2 bg-ink" />
            Library
          </span>
        </Link>
        {STATUSES.map((s) => {
          const active = onLibrary && status === s;
          return (
            <Link
              key={s}
              to={libraryHref(params, 'status', s)}
              aria-current={active ? 'page' : undefined}
              className={navItemClass(active)}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`size-2 ${STATUS_META[s].dotClass}`}
                />
                {STATUS_META[s].label}
              </span>
            </Link>
          );
        })}
        <Link
          to="/stats"
          aria-current={pathname === '/stats' ? 'page' : undefined}
          className={navItemClass(pathname === '/stats')}
        >
          <span className="flex items-center gap-2.5">
            <StatsIcon />
            Stats
          </span>
        </Link>
      </nav>

      <nav aria-label="Platforms" className="flex flex-col gap-1">
        <NavHeading>Platforms</NavHeading>
        {platformSchema.options.map((p) => {
          const active = onLibrary && platform === p;
          return (
            <Link
              key={p}
              // Clicking the active platform clears it, as in the design.
              to={libraryHref(params, 'platform', active ? undefined : p)}
              aria-current={active ? 'page' : undefined}
              className={navItemClass(active, 'sm')}
            >
              {PLATFORM_LABELS[p]}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
