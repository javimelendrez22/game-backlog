import { Link, Outlet } from 'react-router-dom';
import { BackIcon } from '../ui/icons';

/** Full-width page with a "Back to library" link and no sidebar. */
export function FocusLayout() {
  return (
    <div className="box-border min-h-screen bg-bg px-4 pt-8 pb-16 text-ink sm:px-10">
      <main className="mx-auto flex max-w-[1120px] flex-col gap-9">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-medium text-ink-soft no-underline hover:text-ink"
        >
          <BackIcon />
          Back to library
        </Link>
        <Outlet />
      </main>
    </div>
  );
}
