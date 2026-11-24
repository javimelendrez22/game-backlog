import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { BackIcon } from '../ui/icons';

interface FocusLayoutContext {
  /** Right side of the "Back to library" row; null until it has mounted. */
  actionsSlot: HTMLElement | null;
}

/** Full-width page with a "Back to library" link and no sidebar. */
export function FocusLayout() {
  // A callback ref in state, so pages re-render once the slot exists.
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  return (
    <div className="box-border min-h-screen bg-bg px-4 pt-8 pb-16 text-ink sm:px-10">
      <main className="mx-auto flex max-w-[1120px] flex-col gap-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-medium text-ink-soft no-underline hover:text-ink"
          >
            <BackIcon />
            Back to library
          </Link>
          <div ref={setActionsSlot} className="contents" />
        </div>
        <Outlet context={{ actionsSlot } satisfies FocusLayoutContext} />
      </main>
    </div>
  );
}

/** Renders page actions (e.g. "Delete game") in the layout's top row. */
export function FocusActions({ children }: { children: ReactNode }) {
  const { actionsSlot } = useOutletContext<FocusLayoutContext>();
  return actionsSlot ? createPortal(children, actionsSlot) : null;
}
