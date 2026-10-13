import { readFileSync } from 'node:fs';
import * as kdbxweb from 'kdbxweb';
import { describe, expect, it, vi } from 'vitest';
// Importing keepassService is what installs the impl into kdbxweb's CryptoEngine. It only
// pulls in the emscripten runtime on the first hash, so the Module stub below still lands first.
import './keepassService';

const simdWasm = new Uint8Array(readFileSync('node_modules/argon2-browser/dist/argon2-simd.wasm'));

// In the extension argon2-browser gets the SIMD binary from our `loadArgon2WasmBinary` hook
// (covered below). Under vitest it sees node's `process` and prefers a filesystem loader
// instead, and stubbing `process` out breaks the runner - so hand emscripten the same binary
// through the one seam both paths honour.
(globalThis as { Module?: unknown }).Module = { wasmBinary: simdWasm };

describe('argon2 wasm impl', () => {
  it('hands argon2-browser the SIMD build', async () => {
    const loadBinary = (globalThis as { loadArgon2WasmBinary?: () => Promise<Uint8Array> })
      .loadArgon2WasmBinary;
    expect(loadBinary).toBeTypeOf('function');

    const requested: string[] = [];
    vi.stubGlobal('fetch', (url: string) => {
      requested.push(url);
      return Promise.resolve(new Response(simdWasm));
    });
    const binary = await loadBinary!();
    vi.unstubAllGlobals();

    expect(requested[0]).toMatch(/argon2-simd.*\.wasm$/);
    expect([...binary.subarray(0, 4)]).toEqual([0x00, 0x61, 0x73, 0x6d]);
  });

  it('derives the expected argon2id key', async () => {
    const key = await kdbxweb.CryptoEngine.argon2(
      new Uint8Array(32).fill(1).buffer,
      new Uint8Array(16).fill(2).buffer,
      32, // memory, KiB
      3, // iterations
      32, // length
      4, // parallelism
      kdbxweb.CryptoEngine.Argon2TypeArgon2id,
      0x13
    );
    // Same parameters as the RFC 9106 s5.3 vector minus the secret and associated data, which
    // kdbxweb never sends. This build reproduces the full RFC vector when they are supplied.
    expect(Buffer.from(key).toString('hex')).toBe(
      '03aab965c12001c9d7d0d2de33192c0494b684bb148196d73c1df1acaf6d0c2e'
    );
  });

  it('rejects argon2 v0x10 instead of deriving a wrong key', async () => {
    // argon2-browser hardcodes 0x13, so accepting 0x10 would look like a bad password.
    await expect(
      kdbxweb.CryptoEngine.argon2(
        new Uint8Array(32).buffer,
        new Uint8Array(16).buffer,
        32,
        1,
        32,
        1,
        kdbxweb.CryptoEngine.Argon2TypeArgon2id,
        0x10
      )
    ).rejects.toThrow(/0x10/);
  });
});
