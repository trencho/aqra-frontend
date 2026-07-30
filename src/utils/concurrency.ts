/**
 * Default ceiling on simultaneous in-flight requests.
 *
 * Browsers already cap connections per host (~6), so a bare Promise.all over
 * every city x sensor does not actually run faster -- it just queues hundreds
 * of requests in the browser, each subject to the client timeout while it
 * waits its turn, which is how a slow network turned into a wall of timeouts.
 */
export const DEFAULT_CONCURRENCY = 6;

/**
 * Like `Promise.all(items.map(fn))`, but with at most `limit` calls in flight.
 *
 * Results keep the order of `items`, regardless of completion order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[] | null | undefined,
  fn: (item: T, index: number) => Promise<R>,
  limit: number = DEFAULT_CONCURRENCY
): Promise<R[]> {
  const list = [...(items || [])];
  const results = new Array<R>(list.length);

  if (!list.length) {
    return results;
  }

  const size = Math.max(1, Math.min(limit, list.length));
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (cursor < list.length) {
      const index = cursor++;
      // Non-null assertion rather than a guard: the loop condition above
      // already establishes index < list.length. noUncheckedIndexedAccess
      // cannot see that, and adding a runtime check would introduce a branch
      // no test can reach.
      results[index] = await fn(list[index]!, index);
    }
  };

  await Promise.all(Array.from({ length: size }, worker));

  return results;
}
