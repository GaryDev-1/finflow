import { describe, it, expect, beforeAll } from 'vitest';
import { verifyToken, signToken, extractToken } from '../middleware/auth.js';

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-minimum-32-chars';
});

describe('extractToken', () => {
  it('returns token from valid Bearer header', () => {
    expect(extractToken('Bearer abc123')).toBe('abc123');
  });

  it('returns null when header is missing', () => {
    expect(extractToken(undefined)).toBeNull();
  });

  it('returns null when header does not start with Bearer', () => {
    expect(extractToken('Basic abc123')).toBeNull();
    expect(extractToken('abc123')).toBeNull();
  });

  it('returns null for bare "Bearer " with no token', () => {
    expect(extractToken('Bearer ')).toBe('');
  });
});

describe('signToken / verifyToken', () => {
  it('signs and verifies a token with correct payload', async () => {
    const token = await signToken({ sub: 'user-001', username: 'demo' });
    expect(typeof token).toBe('string');

    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-001');
    expect((payload as any)?.username).toBe('demo');
  });

  it('returns null for a tampered token', async () => {
    const token = await signToken({ sub: 'user-001', username: 'demo' });
    const tampered = token.slice(0, -5) + 'xxxxx';
    const result = await verifyToken(tampered);
    expect(result).toBeNull();
  });

  it('returns null for a completely invalid token', async () => {
    const result = await verifyToken('not.a.valid.jwt');
    expect(result).toBeNull();
  });

  it('returns null when JWT_SECRET is wrong', async () => {
    const token = await signToken({ sub: 'user-001', username: 'demo' });
    process.env.JWT_SECRET = 'different-secret-key-also-minimum-32-chars!!';
    const result = await verifyToken(token);
    expect(result).toBeNull();
    // Restore
    process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-minimum-32-chars';
  });
});
