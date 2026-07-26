import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedMemory } from './protectedMemory';

const sessionStore = vi.hoisted(() => new Map<string, unknown>());

vi.mock('webextension-polyfill', () => ({
  default: {
    storage: {
      session: {
        get: async (key: string) => ({ [key]: sessionStore.get(key) }),
        set: async (items: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(items)) sessionStore.set(k, v);
        },
        remove: async (key: string) => {
          sessionStore.delete(key);
        },
        clear: async () => {
          sessionStore.clear();
        },
      },
    },
  },
}));

describe('ProtectedMemory', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('round-trips a plain object through encrypt/decrypt', async () => {
    const pm = new ProtectedMemory();
    await pm.setData('greeting', { hello: 'world', n: 42 });
    const result = await pm.getData<{ hello: string; n: number }>('greeting');
    expect(result).toEqual({ hello: 'world', n: 42 });
  });

  it('round-trips an ArrayBuffer, preserving it as a typed array', async () => {
    const pm = new ProtectedMemory();
    const original = new Uint8Array([1, 2, 3, 4]).buffer;
    await pm.setData('buf', original);
    const result = await pm.getData<Uint8Array>('buf');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result as Uint8Array)).toEqual([1, 2, 3, 4]);
  });

  it('returns undefined for a cache miss', async () => {
    const pm = new ProtectedMemory();
    const result = await pm.getData('missing');
    expect(result).toBeUndefined();
  });

  it('clearData removes a single key without touching others', async () => {
    const pm = new ProtectedMemory();
    await pm.setData('keep', 'a');
    await pm.setData('drop', 'b');
    await pm.clearData('drop');
    expect(await pm.getData('keep')).toBe('a');
    expect(await pm.getData('drop')).toBeUndefined();
  });

  it('serialize/deserialize round-trip without going through storage', () => {
    const pm = new ProtectedMemory();
    const serialized = pm.serialize({ a: [1, 2, 3] });
    expect(pm.deserialize(serialized)).toEqual({ a: [1, 2, 3] });
  });

  it('deserialize returns undefined for empty input', () => {
    const pm = new ProtectedMemory();
    expect(pm.deserialize(undefined)).toBeUndefined();
    expect(pm.deserialize('')).toBeUndefined();
  });
});
