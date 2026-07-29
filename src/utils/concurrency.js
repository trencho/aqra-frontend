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
 *
 * @param {Array} items
 * @param {(item: any, index: number) => Promise<any>} fn
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function mapWithConcurrency(
  items,
  fn,
  limit = DEFAULT_CONCURRENCY
) {
  const list = [...(items || [])];
  const results = new Array(list.length);

  if (!list.length) {
    return results;
  }

  const size = Math.max(1, Math.min(limit, list.length));
  let cursor = 0;

  const worker = async () => {
    while (cursor < list.length) {
      const index = cursor++;
      results[index] = await fn(list[index], index);
    }
  };

  await Promise.all(Array.from({ length: size }, worker));

  return results;
}
