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

  // CHARACTERIZATION -- an empty message is passed through, not replaced,
  // because the `cause?.message ?? fallback` this replaces did the same. It
  // renders as a blank error banner. Deliberately preserved; changing it is a
  // behaviour fix, not part of the type migration.
  it('passes an empty message through rather than falling back', () => {
    expect(errorMessage({ message: '' }, 'fallback')).toBe('');
  });

  it('falls back when message is present but not a string', () => {
    expect(errorMessage({ message: 500 }, 'fallback')).toBe('fallback');
    expect(errorMessage({ message: null }, 'fallback')).toBe('fallback');
  });
});
