import { useId, useState, type KeyboardEvent, type Ref } from 'react';
import type { IgdbSearchResult } from '@org/contracts';
import {
  isIgdbNotConfigured,
  MIN_IGDB_SEARCH,
  useIgdbSearch,
} from '../../api/igdb';

function year(date: string | null) {
  return date ? date.slice(0, 4) : null;
}

/** Smaller IGDB image size for the dropdown thumbnails. */
function thumbUrl(url: string) {
  return url.replace('/t_cover_big/', '/t_cover_small/');
}

/**
 * The Title field from the design, doubling as an IGDB autocomplete
 * (ARIA 1.2 combobox with a listbox popup). Typing edits the title; picking
 * a match hands the whole IGDB result to `onPick`.
 */
export function IgdbSearchField({
  value,
  onChange,
  onBlur,
  onPick,
  pickedId,
  error,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onPick: (result: IgdbSearchResult) => void;
  /** igdbId of the current pick, marked selected in the list. */
  pickedId: number | null;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const search = useIgdbSearch(value, open);
  const items = search.data?.items ?? [];
  const tooShort = value.trim().length < MIN_IGDB_SEARCH;
  const showPopup = open && !tooShort;
  const showList = showPopup && items.length > 0;

  let status: string | null = null;
  if (showPopup) {
    if (search.isError) {
      status = isIgdbNotConfigured(search.error)
        ? "IGDB search isn't set up. You can still add the game by hand."
        : "Couldn't reach IGDB. You can still add the game by hand.";
    } else if (search.isPending && items.length === 0) {
      status = 'Searching IGDB…';
    } else if (search.isSuccess && items.length === 0 && !search.isPending) {
      status = 'No matches on IGDB. Keep typing, or add it by hand.';
    }
  }

  function pick(result: IgdbSearchResult) {
    onPick(result);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (items.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + items.length) % items.length);
    } else if (e.key === 'Enter' && showList && active >= 0) {
      // Pick instead of submitting the form.
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        Title
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={
            showList && active >= 0 ? `${listId}-${active}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          autoComplete="off"
          placeholder="Start typing a game name"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
          className={`box-border h-12 w-full rounded-xl border bg-surface-sunken px-3.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-border-strong ${
            error ? 'border-status-wishlist' : 'border-border'
          }`}
        />

        {showPopup && (showList || status) && (
          <div className="absolute inset-x-0 top-[calc(100%+6px)] z-10 overflow-hidden rounded-xl border border-border-strong bg-surface shadow-[0_12px_32px_rgb(0_0_0/0.45)]">
            {status && (
              <p
                role="status"
                className="m-0 px-3.5 py-3 text-sm text-ink-muted"
              >
                {status}
              </p>
            )}
            <ul
              id={listId}
              role="listbox"
              aria-label="IGDB matches"
              hidden={!showList}
              className="m-0 max-h-[360px] list-none overflow-y-auto p-1.5"
            >
              {items.map((item, i) => (
                <li
                  key={item.igdbId}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={item.igdbId === pickedId}
                  // Keep focus in the input so blur doesn't close the list before the click lands.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                  onMouseMove={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-[9px] px-2 py-1.5 ${
                    i === active ? 'bg-selected' : ''
                  }`}
                >
                  {item.coverImageUrl ? (
                    <img
                      src={thumbUrl(item.coverImageUrl)}
                      alt=""
                      className="h-12 w-9 shrink-0 rounded-[5px] object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-12 w-9 shrink-0 rounded-[5px] bg-border"
                    />
                  )}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-medium text-ink">
                      {item.title}
                    </span>
                    <span className="truncate text-[13px] text-ink-muted">
                      {[year(item.releaseDate), item.developer]
                        .filter(Boolean)
                        .join(' · ') || 'No details on IGDB'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="m-0 text-[13px] text-status-wishlist">
          {error}
        </p>
      ) : (
        <p id={`${id}-hint`} className="m-0 text-[13px] text-ink-muted">
          Pick a match from IGDB to fill in the details, or just type a title.
        </p>
      )}
    </div>
  );
}
