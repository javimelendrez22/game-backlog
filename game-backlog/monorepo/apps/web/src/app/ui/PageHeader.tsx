import type { ReactNode } from 'react';

export function PageHeader({
  title,
  summary,
  actions,
}: {
  title: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-display text-[40px] font-bold uppercase leading-[1.05] tracking-[0.01em]">
          {title}
        </h1>
        {summary && <p className="m-0 text-[15px] text-ink-muted">{summary}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      )}
    </header>
  );
}

export function SectionHeading({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="m-0 font-display text-[22px] font-semibold">
      {children}
    </h2>
  );
}
