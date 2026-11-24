import { useState } from 'react';
import { isAxiosError } from 'axios';
import {
  Controller,
  useForm,
  type FieldErrors,
  type Resolver,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  createGameSchema,
  type CreateGameInput,
  type GameStatus,
  type IgdbSearchResult,
  type Platform,
} from '@org/contracts';
import { useCreateGame } from '../api/games';
import { Button, LinkButton } from '../ui/Button';
import { GameCover } from '../ui/GameCover';
import { PageHeader } from '../ui/PageHeader';
import { IgdbSearchField } from './add-game/IgdbSearchField';
import { PlatformPicker, RatingPicker, StatusPicker } from './add-game/pickers';

interface FormValues {
  title: string;
  /** The IGDB match the user picked; null for a game added by hand. */
  picked: IgdbSearchResult | null;
  status: GameStatus;
  platforms: Platform[];
  rating: number | null;
  /** Raw text from the number input; converted on submit. */
  hoursPlayed: string;
}

const DEFAULTS: FormValues = {
  title: '',
  picked: null,
  status: 'backlog',
  platforms: [],
  rating: null,
  hoursPlayed: '',
};

const showsRating = (s: GameStatus) => s !== 'wishlist';
const showsHours = (s: GameStatus) =>
  s === 'playing' || s === 'completed' || s === 'dropped';

/** Form state -> POST /api/games body. Fields hidden for the status are sent as null. */
export function toCreateInput(v: FormValues): CreateGameInput {
  const { picked } = v;
  const hours = v.hoursPlayed.trim();
  return {
    igdbId: picked?.igdbId ?? null,
    title: v.title.trim(),
    genres: picked?.genres ?? [],
    developer: picked?.developer ?? null,
    publisher: picked?.publisher ?? null,
    releaseDate: picked?.releaseDate ?? null,
    coverImageUrl: picked?.coverImageUrl ?? null,
    platforms: v.platforms,
    status: v.status,
    rating: showsRating(v.status) ? v.rating : null,
    hoursPlayed: showsHours(v.status) && hours !== '' ? Number(hours) : null,
  };
}

const MESSAGES: Partial<Record<keyof FormValues, (code: string) => string>> = {
  title: (code) =>
    code === 'too_big'
      ? 'Keep the title under 200 characters'
      : 'Enter a title',
  platforms: () => 'Pick at least one platform',
  hoursPlayed: () => 'Enter hours as a number, 0 or more',
  rating: () => 'Pick a rating from 1 to 10',
};

/** Validates with the same `createGameSchema` the API uses. */
const resolver: Resolver<FormValues> = async (values) => {
  const result = createGameSchema.safeParse(toCreateInput(values));
  if (result.success) return { values, errors: {} };

  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof FormValues;
    const message = MESSAGES[field];
    if (message && !errors[field]) {
      errors[field] = { type: issue.code, message: message(issue.code) };
    }
  }
  return { values: {}, errors: errors as FieldErrors<FormValues> };
};

function PickedGame({
  game,
  onClear,
}: {
  game: IgdbSearchResult;
  onClear: () => void;
}) {
  const details = [
    ['Released', game.releaseDate],
    ['Developer', game.developer],
    ['Publisher', game.publisher],
    ['Genres', game.genres.join(', ') || null],
  ].filter((d): d is [string, string] => d[1] !== null);

  return (
    <section
      aria-label="IGDB match"
      className="flex flex-wrap items-start gap-4 rounded-2xl border border-border bg-surface-sunken p-3.5"
    >
      <div className="w-[72px] shrink-0">
        <GameCover
          game={{
            id: String(game.igdbId),
            title: game.title,
            coverImageUrl: game.coverImageUrl,
          }}
          size="sm"
        />
      </div>
      <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          Filled in from IGDB
        </p>
        <p className="m-0 text-[17px] font-semibold">{game.title}</p>
        {details.length > 0 && (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
            {details.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="m-0 text-ink-soft">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <Button variant="secondary" onClick={onClear} className="shrink-0">
        Not this game
      </Button>
    </section>
  );
}

export function AddGamePage() {
  const navigate = useNavigate();
  const create = useCreateGame();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<FormValues>({ resolver, defaultValues: DEFAULTS });

  const status = watch('status');
  const picked = watch('picked');
  // Re-check a field as it changes, but only once the user has tried to submit.
  const opts = { shouldValidate: isSubmitted, shouldDirty: true };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await create.mutateAsync(toCreateInput(values));
      navigate('/');
    } catch (err) {
      setSubmitError(
        isAxiosError(err) && err.response?.status === 409
          ? `${values.title.trim()} is already in your library.`
          : "Couldn't save the game. Try again.",
      );
    }
  });

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="mx-auto box-border flex w-full max-w-[640px] flex-col gap-7 rounded-[22px] border border-border bg-surface p-5 sm:p-9"
    >
      <PageHeader
        title="Add a game"
        summary="Put it on your shelf: in your backlog, in progress, done, or wanted."
      />

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <IgdbSearchField
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            inputRef={field.ref}
            pickedId={picked?.igdbId ?? null}
            error={errors.title?.message}
            onPick={(result) => {
              setValue('picked', result, opts);
              setValue('title', result.title, opts);
              setSubmitError(null);
            }}
          />
        )}
      />

      {picked && (
        <PickedGame
          game={picked}
          onClear={() => setValue('picked', null, opts)}
        />
      )}

      <StatusPicker
        value={status}
        onChange={(s) => setValue('status', s, opts)}
      />

      <PlatformPicker
        value={watch('platforms')}
        onChange={(p) => setValue('platforms', p, opts)}
        error={errors.platforms?.message}
      />

      {showsRating(status) && (
        <RatingPicker
          value={watch('rating')}
          onChange={(r) => setValue('rating', r, opts)}
        />
      )}

      {showsHours(status) && (
        <div className="flex flex-col gap-2">
          <label htmlFor="hours-played" className="text-sm font-semibold">
            Hours played so far
          </label>
          <input
            id="hours-played"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            placeholder="0"
            aria-invalid={errors.hoursPlayed ? true : undefined}
            aria-describedby={errors.hoursPlayed ? 'hours-error' : undefined}
            {...register('hoursPlayed')}
            className={`box-border h-12 w-40 rounded-xl border bg-surface-sunken px-3.5 text-base text-ink outline-none placeholder:text-ink-muted focus:border-border-strong ${
              errors.hoursPlayed ? 'border-status-wishlist' : 'border-border'
            }`}
          />
          {errors.hoursPlayed && (
            <p
              id="hours-error"
              className="m-0 text-[13px] text-status-wishlist"
            >
              {errors.hoursPlayed.message}
            </p>
          )}
        </div>
      )}

      {submitError && (
        <p
          role="alert"
          className="m-0 rounded-xl border border-status-wishlist/40 bg-status-wishlist/10 px-3.5 py-3 text-sm text-ink"
        >
          {submitError}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pt-1">
        <LinkButton to="/" variant="secondary">
          Cancel
        </LinkButton>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : status === 'wishlist'
              ? 'Add to wishlist'
              : 'Add to library'}
        </Button>
      </div>
    </form>
  );
}
