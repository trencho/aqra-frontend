import { describe, it, expect, vi } from 'vitest';
import { mapWithConcurrency, DEFAULT_CONCURRENCY } from '../concurrency';

const tick = () => new Promise((r) => setTimeout(r, 0));

/** Runs fn over items while recording the peak number of overlapping calls. */
async function withPeakTracking(items, limit) {
  let inFlight = 0;
  let peak = 0;

  const results = await mapWithConcurrency(
    items,
    async (item) => {
      peak = Math.max(peak, ++inFlight);
      await tick();
      inFlight--;
      return item * 2;
    },
    limit
  );

  return { results, peak };
}

describe('mapWithConcurrency', () => {
  it('returns results in input order, not completion order', async () => {
    const delays = [30, 0, 15];

    const results = await mapWithConcurrency(
      delays,
      async (ms, i) => {
        await new Promise((r) => setTimeout(r, ms));
        return i;
      },
      3
    );

    expect(results).toEqual([0, 1, 2]);
  });

  it('applies the function to every item exactly once', async () => {
    const fn = vi.fn(async (n) => n);

    await mapWithConcurrency([1, 2, 3, 4, 5], fn, 2);

    expect(fn).toHaveBeenCalledTimes(5);
  });

  it('never exceeds the limit', async () => {
    const { peak } = await withPeakTracking([...Array(20).keys()], 4);

    expect(peak).toBeLessThanOrEqual(4);
  });

  it('actually runs work in parallel up to the limit', async () => {
    // A limit of 4 that only ever ran one at a time would also satisfy the
    // assertion above, so check the lower bound too.
    const { peak } = await withPeakTracking([...Array(20).keys()], 4);

    expect(peak).toBe(4);
  });

  it('does not spawn more workers than there are items', async () => {
    const { peak } = await withPeakTracking([1, 2], 10);

    expect(peak).toBe(2);
  });

  it('maps the values correctly', async () => {
    const { results } = await withPeakTracking([1, 2, 3], 2);

    expect(results).toEqual([2, 4, 6]);
  });

  it('returns an empty array for an empty list', async () => {
    const fn = vi.fn();

    expect(await mapWithConcurrency([], fn)).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('tolerates a null list', async () => {
    expect(await mapWithConcurrency(null, vi.fn())).toEqual([]);
  });

  it('treats a limit below 1 as 1 rather than stalling', async () => {
    const { results, peak } = await withPeakTracking([1, 2, 3], 0);

    expect(peak).toBe(1);
    expect(results).toEqual([2, 4, 6]);
  });

  it('defaults to a sensible limit', () => {
    expect(DEFAULT_CONCURRENCY).toBeGreaterThan(0);
    expect(DEFAULT_CONCURRENCY).toBeLessThanOrEqual(10);
  });

  it('propagates a rejection from the mapped function', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], async (n) => {
        if (n === 2) {
          throw new Error('boom');
        }
        return n;
      })
    ).rejects.toThrow('boom');
  });
});
