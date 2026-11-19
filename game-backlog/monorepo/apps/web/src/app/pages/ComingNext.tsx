import type { ReactNode } from 'react';

/** Placeholder body for screens that aren't built yet. */
export function ComingNext({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-border px-6 py-12 text-center text-[15px] text-ink-muted">
      {children}
    </div>
  );
}
