import { describe, expect, it } from 'vitest';

import { ApiError } from '@/services/axios';

import { errorMessage } from '../errors';

// First spec written as .ts rather than .js, which also exercises the widened
// vitest include glob ('*.spec.{js,ts}'). Had that glob not been fixed first,
// this file would simply not run and the suite would still report success.
describe('errorMessage', () => {
  it('reads the message off a real Error', () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
  });

  it('reads the message off an ApiError from the interceptor', () => {
    const error = new ApiError('Request to /cities/ failed with status 503', {
      status: 503,
    });

    expect(errorMessage(error, 'fallback')).toBe(
      'Request to /cities/ failed with status 503'
    );
  });

  // The axios interceptor is exercised with bare object literals, and a
  // rejected promise can carry anything, so duck typing is deliberate.
  it('reads the message off a plain object', () => {
    expect(errorMessage({ message: 'offline' }, 'fallback')).toBe('offline');
  });

  it('falls back for null and undefined', () => {
    expect(errorMessage(null, 'fallback')).toBe('fallback');
    expect(errorMessage(undefined, 'fallback')).toBe('fallback');
  });

  it('falls back for a value carrying no message at all', () => {
    expect(errorMessage({}, 'fallback')).toBe('fallback');
    expect(errorMessage('a bare string', 'fallback')).toBe('fallback');
  });

  // The store assigns this to `error`, and `hasError` is `error !== null`, so
  // an empty message used to open the snackbar with nothing in it -- a red bar
  // and a dismiss button telling the user only that something unspecified
  // failed. "No usable message" is exactly what the fallback is for.
  it('falls back on an empty message rather than showing a blank banner', () => {
    expect(errorMessage({ message: '' }, 'fallback')).toBe('fallback');
  });

  it('falls back when message is present but not a string', () => {
    expect(errorMessage({ message: 500 }, 'fallback')).toBe('fallback');
    expect(errorMessage({ message: null }, 'fallback')).toBe('fallback');
  });
});
