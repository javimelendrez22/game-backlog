import { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Game } from '@org/contracts';
import { useDeleteGame } from '../../api/games';
import { Button } from '../../ui/Button';
import { TrashIcon } from '../../ui/icons';

/**
 * "Delete <title>?" confirmation. Built on a native modal <dialog>, which
 * traps focus, makes the page behind it inert and closes on Escape.
 */
export function DeleteGameDialog({
  game,
  open,
  onClose,
}: {
  game: Pick<Game, 'id' | 'title'>;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descId = useId();
  const navigate = useNavigate();
  const del = useDeleteGame();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Forget a previous failure each time the dialog is reopened.
  const { reset } = del;
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const close = () => {
    if (!del.isPending) onClose();
  };

  const confirm = () =>
    del.mutate(game.id, {
      onSuccess: () => navigate('/', { replace: true }),
    });

  return (
    // Clicks on the dialog element itself are clicks on the backdrop.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="m-auto w-[calc(100%-48px)] max-w-[460px] rounded-[18px] border border-border-strong bg-surface p-0 text-ink shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop:bg-scrim"
    >
      <div className="flex flex-col gap-5 p-7">
        <div className="flex size-12 items-center justify-center rounded-xl bg-danger-soft text-danger-ink">
          <TrashIcon size={22} />
        </div>
        <div className="flex flex-col gap-2">
          <h2
            id={headingId}
            className="m-0 font-display text-[28px] font-bold uppercase leading-[1.1] tracking-[0.01em]"
          >
            Delete {game.title}?
          </h2>
          <p id={descId} className="m-0 text-[15px] leading-normal text-ink-soft">
            It will be removed from your backlog, along with its status, rating
            and hours played. This can’t be undone.
          </p>
        </div>
        {del.isError && (
          <p role="alert" className="m-0 text-[15px] text-danger-ink">
            Couldn’t delete this game. Try again.
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            className="min-h-12 px-[22px]"
            onClick={close}
            disabled={del.isPending}
            autoFocus
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="min-h-12 px-[22px]"
            onClick={confirm}
            disabled={del.isPending}
          >
            {del.isPending ? 'Deleting…' : 'Delete game'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
