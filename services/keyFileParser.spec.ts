import { describe, expect, it } from 'vitest';
import { KeyFileParser } from './keyFileParser';

// ponytail: the XML key-file branch isn't covered here - happy-dom doesn't implement
// document.evaluate/XPathResult. Cover it with a real-browser/jsdom test if that branch
// ever needs changing.
describe('KeyFileParser', () => {
  it('rejects an empty file', async () => {
    const parser = new KeyFileParser();
    await expect(parser.getKeyFromFile(new ArrayBuffer(0))).rejects.toThrow(
      'The key file cannot be empty'
    );
  });

  it('uses a 32-byte file directly as the key', async () => {
    const parser = new KeyFileParser();
    const bytes = new Uint8Array(32).map((_, i) => i);
    const key = await parser.getKeyFromFile(bytes.buffer);
    expect(new Uint8Array(key)).toEqual(bytes);
  });

  it('decodes a 64-character hex file into a 32-byte key', async () => {
    const parser = new KeyFileParser();
    const hex = 'a1'.repeat(32); // 64 hex chars -> 32 bytes
    const bytes = new TextEncoder().encode(hex);
    const key = await parser.getKeyFromFile(bytes.buffer);
    expect(new Uint8Array(key)).toEqual(new Uint8Array(32).fill(0xa1));
  });

  it('falls back to hashing arbitrary file content', async () => {
    const parser = new KeyFileParser();
    const bytes = new TextEncoder().encode('not a keyfile in any known format, just some text');
    const key = await parser.getKeyFromFile(bytes.buffer);
    // SHA-256 output is always 32 bytes, and hashing is deterministic.
    expect(key.byteLength).toBe(32);
    const again = await parser.getKeyFromFile(bytes.buffer);
    expect(new Uint8Array(again)).toEqual(new Uint8Array(key));
  });

  it('a 64-byte file that is not valid hex falls back to hashing instead of erroring', async () => {
    const parser = new KeyFileParser();
    const bytes = new Uint8Array(64).fill(0); // valid bytes, but decodes to non-hex text
    const key = await parser.getKeyFromFile(bytes.buffer);
    expect(key.byteLength).toBe(32);
  });
});
