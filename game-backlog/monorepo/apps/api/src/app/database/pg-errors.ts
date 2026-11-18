/** Postgres error code for unique_violation. */
const UNIQUE_VIOLATION = '23505';

type PgError = { code?: string; constraint?: string };

/**
 * True when `err` is a Postgres unique violation on `constraint`.
 * Drizzle wraps driver errors in `DrizzleQueryError` with the pg error on
 * `.cause`, so check both the error itself and its cause.
 */
export function isUniqueViolation(err: unknown, constraint: string): boolean {
  const candidates = [err, (err as { cause?: unknown } | null)?.cause];
  return candidates.some((e) => {
    const pg = e as PgError | null | undefined;
    return pg?.code === UNIQUE_VIOLATION && pg.constraint === constraint;
  });
}
