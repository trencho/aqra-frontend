/**
 * Read a message off an unknown thrown value.
 *
 * Under `strict`, TypeScript types a catch binding as `unknown`
 * (useUnknownInCatchVariables), so `catch (e) { e.message }` no longer
 * compiles. This is the one place that narrowing happens, rather than at every
 * catch site.
 *
 * Duck-typed rather than `instanceof Error`: what reaches the store's catch is
 * an ApiError from the axios interceptor, but the interceptor itself is tested
 * with bare object literals, and rejected promises can carry anything at all.
 */
/**
 * Faithful to the `cause?.message ?? fallback` this replaces, which means an
 * empty-string message is returned as-is rather than falling back. That renders
 * as a blank error banner, which is a pre-existing wart -- but changing it here
 * would be an unrequested behaviour change during a type migration. Recorded as
 * a follow-up instead.
 */
export function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null | undefined)?.message;

  return typeof message === 'string' ? message : fallback;
}
