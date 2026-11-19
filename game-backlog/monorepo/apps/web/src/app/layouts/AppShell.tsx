import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

/** Sidebar + main column. On narrow screens the sidebar wraps above main. */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-wrap bg-bg text-ink">
      <Sidebar />
      <main className="box-border min-w-0 flex-[999_1_560px] px-4 pt-9 pb-16 sm:px-10">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
