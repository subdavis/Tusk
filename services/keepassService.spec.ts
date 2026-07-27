import { describe, expect, it } from 'vitest';
import { KeepassService } from './keepassService';
import type { KeepassHeader } from './keepassHeader';
import type { KeepassReference } from './keepassReference';
import type { PasswordFileStoreRegistry } from './passwordFileStore';
import type { Settings } from './settings';
import type { Entry } from './types';

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    groupName: 'root',
    searchable: true,
    keys: ['title', 'url'],
    protectedData: {},
    title: '',
    url: '',
    ...overrides,
  };
}

// rankEntries doesn't touch the constructor-injected services, so stub them out.
const service = new KeepassService(
  {} as KeepassHeader,
  {} as Settings,
  {} as PasswordFileStoreRegistry,
  {} as KeepassReference
);

describe('KeepassService.rankEntries', () => {
  it('ranks an exact origin match highest', () => {
    const entries = [makeEntry({ title: 'Example', url: 'https://example.com/login' })];
    service.rankEntries(entries, new URL('https://example.com/login'), 'Example', []);
    expect(entries[0].matchRank).toBeGreaterThanOrEqual(100);
  });

  it('ranks a same-host, different-protocol match as a possible match', () => {
    const entries = [makeEntry({ title: 'Example', url: 'http://example.com' })];
    service.rankEntries(entries, new URL('https://example.com/'), 'Example', []);
    expect(entries[0].matchRank).toBeGreaterThanOrEqual(10);
    expect(entries[0].matchRank).toBeLessThan(100);
  });

  it('flags a same-hostname-different-port match as likely phishing', () => {
    const entries = [makeEntry({ title: 'Bank', url: 'https://example.com:8443' })];
    service.rankEntries(entries, new URL('https://example.com/'), 'Bank', []);
    expect(entries[0].matchRank).toBeLessThanOrEqual(-100 + 1);
  });

  it('gives unrelated entries a low/zero base rank', () => {
    const entries = [makeEntry({ title: 'Unrelated', url: 'https://unrelated.test' })];
    service.rankEntries(entries, new URL('https://example.com/'), 'Example', []);
    expect(entries[0].matchRank).toBe(0);
  });

  it('adds a token-overlap bonus when site tokens match entry tokens', () => {
    const withToken = [makeEntry({ title: 'Example', url: 'https://unrelated.test' })];
    const withoutToken = [makeEntry({ title: 'Other', url: 'https://unrelated.test' })];
    service.rankEntries(withToken, new URL('https://example.com/'), 'Example', ['example']);
    service.rankEntries(withoutToken, new URL('https://example.com/'), 'Example', ['example']);
    expect(withToken[0].matchRank).toBeGreaterThan(withoutToken[0].matchRank!);
  });
});
