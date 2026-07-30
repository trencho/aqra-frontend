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
 * An empty message falls back.
 *
 * It used to be returned as-is, faithful to the `cause?.message ?? fallback`
 * this replaced. But the store assigns the result to `error`, and `hasError` is
 * `error !== null` -- so an empty message opened the snackbar with nothing in
 * it: a red bar, a dismiss button, and no indication of what went wrong. A
 * fallback exists precisely for "there is no usable message here", and an empty
 * string is that case.
 */
export function errorMessage(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown } | null | undefined)?.message;

  return typeof message === 'string' && message !== '' ? message : fallback;
}
