/**
 * Service for opening keepass files
 */
import * as Base64 from 'base64-arraybuffer';
import * as Case from 'case';
import * as kdbxweb from 'kdbxweb';
// @ts-expect-error argon2-browser ships no types
import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';
import argon2SimdWasmUrl from 'argon2-browser/dist/argon2-simd.wasm?url';
import { getValidTokens, parseUrl } from '@/lib/utils';
import type { KeepassHeader } from './keepassHeader';
import type { KeepassReference } from './keepassReference';
import type { PasswordFileStoreRegistry } from './passwordFileStore';
import type { KeyFile, Settings } from './settings';
import type { DecryptedDatabase, Entry, KdbxCredentialsJSON, ProtectedValueJSON } from './types';

// argon2-bundled.min.js embeds the scalar argon2.wasm. Hand it the SIMD build instead:
// identical import/export ABI, ~2x faster. wasm SIMD has shipped since Chrome 91 / Firefox 89
// and the manifest already requires Chrome 102+. There is no asm.js fallback in
// argon2-browser - if wasm fails to instantiate, hashing throws, it does not silently
// degrade to JS.
(globalThis as { loadArgon2WasmBinary?: () => Promise<Uint8Array> }).loadArgon2WasmBinary = () =>
  fetch(argon2SimdWasmUrl)
    .then((res) => res.arrayBuffer())
    .then((buf) => new Uint8Array(buf));

kdbxweb.CryptoEngine.setArgon2Impl(
  async (password, salt, memory, iterations, length, parallelism, type, version) => {
    // argon2-browser hardcodes version 0x13 and ignores the version we pass. kdbxweb accepts
    // 0x10 too, and that would silently derive the wrong key and surface as "invalid password".
    if (version !== 0x13) {
      throw new Error(`Unsupported argon2 version 0x${version.toString(16)}`);
    }
    const result = await argon2.hash({
      pass: new Uint8Array(password),
      salt: new Uint8Array(salt),
      time: iterations,
      mem: memory,
      hashLen: length,
      parallelism,
      type,
      version,
    });
    return (result.hash as Uint8Array).buffer as ArrayBuffer;
  }
);

function protectedValueToJSON(pv: kdbxweb.ProtectedValue): ProtectedValueJSON {
  return {
    salt: Array.from(pv.salt),
    value: Array.from(pv.value),
  };
}

function protectedValueJSONToArrayBuffer(pv: ProtectedValueJSON): kdbxweb.ProtectedValue {
  return new kdbxweb.ProtectedValue(
    Uint8Array.from(pv.value).buffer,
    Uint8Array.from(pv.salt).buffer
  );
}

function kdbxCredentialsToJson(creds: kdbxweb.KdbxCredentials): KdbxCredentialsJSON {
  return {
    passwordHash: creds.passwordHash ? protectedValueToJSON(creds.passwordHash) : null,
    keyFileHash: creds.keyFileHash ? protectedValueToJSON(creds.keyFileHash) : null,
  };
}

function jsonCredentialsToKdbx(jsonCreds: KdbxCredentialsJSON): kdbxweb.KdbxCredentials {
  const creds = new kdbxweb.Credentials(null, null);
  if (jsonCreds.passwordHash)
    creds.passwordHash = protectedValueJSONToArrayBuffer(jsonCreds.passwordHash);
  if (jsonCreds.keyFileHash)
    creds.keyFileHash = protectedValueJSONToArrayBuffer(jsonCreds.keyFileHash);
  return creds;
}

function convertArrayToUUID(arr: ArrayBuffer): string {
  const int8Arr = new Uint8Array(arr);
  const result = new Array(int8Arr.byteLength * 2);
  for (let i = 0; i < int8Arr.byteLength; i++) {
    const hexit = int8Arr[i].toString(16).toUpperCase();
    result[i * 2] = hexit.length == 2 ? hexit : '0' + hexit;
  }
  return result.join('');
}

/**
 * Takes a kdbxweb group array and transforms it into a list of entries.
 */
function parseKdbxDb(groups: kdbxweb.KdbxGroup[]): Entry[] {
  let results: Entry[] = [];
  for (const group of groups) {
    if (group.groups.length > 0) {
      // recursive case for subgroups.
      results = results.concat(parseKdbxDb(group.groups));
    }
    for (const dbEntry of group.entries) {
      const entry: Entry = {
        protectedData: {},
        keys: [],
        groupName: group.name ?? '',
        searchable: group.enableSearching !== false,
      };
      // Entry properties defined by the parent group
      entry.groupIconId = group.icon;
      entry.keys.push('groupName');
      if (entry.searchable) results.push(entry);

      // Entry properties defined by the entry
      if (dbEntry.uuid) {
        if (dbEntry.uuid.empty == false)
          entry.id = convertArrayToUUID(Base64.decode(dbEntry.uuid.id));
      }
      if (dbEntry.icon !== undefined) entry.iconId = dbEntry.icon;
      if (dbEntry.tags.length > 0) {
        entry.tags = dbEntry.tags.join(',') + ',';
        entry.keys.push('tags');
      }
      for (const [key, field] of dbEntry.fields) {
        const camelKey = Case.camel(key);
        if (typeof field === 'object') {
          // type = object ? protected value
          entry.protectedData[camelKey] = protectedValueToJSON(field);
        } else {
          entry.keys.push(camelKey);
          entry[camelKey] = field;
        }
      }
      if (dbEntry.times.expires && dbEntry.times.expiryTime) {
        entry.expiry = dbEntry.times.expiryTime.toString();
        entry.is_expired = Date.now() - dbEntry.times.expiryTime.getTime() > 0;
        entry.keys.push('expiry');
      }
    }
  }
  return results;
}

function processReferences(
  entries: Entry[],
  majorVersion: number,
  keepassReference: KeepassReference
): Entry[] {
  // In order to fully implement references, majorVersion will need to be known
  // as there are more capabilities for references in v2+
  entries.forEach((entry) => {
    entry.keys.forEach((key) => {
      const fieldRefs = keepassReference.hasReferences(entry[key] as string);
      if (fieldRefs) {
        const value = keepassReference.processAllReferences(
          majorVersion,
          entry[key] as string,
          entry,
          entries
        );
        if (['password', 'otp'].indexOf(key) >= 0) {
          const newProtectedVal = kdbxweb.ProtectedValue.fromString(value);
          entry.protectedData[Case.camel(key)] = protectedValueToJSON(newProtectedVal);
          delete entry[key];
        } else {
          entry[key] = value;
        }
      }
    });
  });
  return entries;
}

export class KeepassService {
  constructor(
    private keepassHeader: KeepassHeader,
    private settings: Settings,
    private passwordFileStoreRegistry: PasswordFileStoreRegistry,
    private keepassReference: KeepassReference
  ) {}

  getChosenDatabaseFile(): Promise<ArrayBuffer> {
    return this.passwordFileStoreRegistry.getChosenDatabaseFile(this.settings);
  }

  /**
   * Validate that one of the following is true:
   * (password isn't empty OR keyfile isn't empty)
   * ELSE
   * (assume password is the empty string)
   */
  async getMasterKey(
    bufferPromise: Promise<ArrayBuffer>,
    masterPassword: string | undefined,
    keyFileInfo: KeyFile | undefined
  ): Promise<KdbxCredentialsJSON> {
    let protectedMasterPassword: kdbxweb.ProtectedValue | null;
    if (masterPassword === undefined && keyFileInfo === undefined) {
      // Neither keyfile nor password provided.  Assume empty string password.
      protectedMasterPassword = kdbxweb.ProtectedValue.fromString('');
    } else if (masterPassword === '' && keyFileInfo !== undefined) {
      // Keyfile but empty password provided.  Assume password is unused.
      // This extension does not support the combo empty string + keyfile.
      protectedMasterPassword = null;
    } else {
      protectedMasterPassword = kdbxweb.ProtectedValue.fromString(masterPassword ?? '');
    }
    const fileKey = keyFileInfo ? Base64.decode(keyFileInfo.encodedKey) : null;
    const buf = await bufferPromise;
    this.keepassHeader.readHeader(buf); // validates the file signature before attempting to derive a key
    const creds = new kdbxweb.Credentials(protectedMasterPassword, fileKey);
    await creds.ready;
    return kdbxCredentialsToJson(creds);
  }

  async getDecryptedData(
    bufferPromise: Promise<ArrayBuffer>,
    masterKey: KdbxCredentialsJSON
  ): Promise<DecryptedDatabase> {
    const buf = await bufferPromise;
    const h = this.keepassHeader.readHeader(buf);
    if (!h) throw new Error('Failed to read file header');

    if (!h.kdbx) {
      // KDB - we don't support this anymore
      throw new Error('Unsupported Database Version');
    }

    // KDBX - use kdbxweb library
    const kdbxCreds = jsonCredentialsToKdbx(masterKey);
    const db = await kdbxweb.Kdbx.load(buf, kdbxCreds);
    const entries = parseKdbxDb(db.groups);
    const majorVersion = db.header.versionMajor;
    return {
      entries: processReferences(entries, majorVersion, this.keepassReference),
      version: majorVersion,
    };
  }

  rankEntries(entries: Entry[], siteUrl: URL, title: string, siteTokens: string[]) {
    entries.forEach((entry) => {
      // apply a ranking algorithm to find the best matches
      let entryOrigins = [parseUrl(entry.url as string)];

      if (entry.keys.indexOf('tuskUrls') >= 0) {
        const others = (entry.tuskUrls as string).split(',').map((val) => parseUrl(val));
        entryOrigins = entryOrigins.concat(others);
      }
      if (entryOrigins.length && entryOrigins.some((a) => a && a.origin == siteUrl.origin))
        entry.matchRank = 100; // perfect match
      else if (entryOrigins.length && entryOrigins.some((a) => a && a.host == siteUrl.host))
        entry.matchRank = 10; // possible match
      else if (entryOrigins.length && entryOrigins.some((a) => a && a.hostname == siteUrl.hostname))
        entry.matchRank = -100; // phishing?
      else entry.matchRank = 0; // None

      const entryTitle = entry.title as string | undefined;
      entry.matchRank +=
        entryTitle && title && entryTitle.toLowerCase() == title.toLowerCase() ? 1 : 0;
      entry.matchRank +=
        entryTitle && entryTitle.toLowerCase() === siteUrl.hostname.toLowerCase() ? 1 : 0;
      entry.matchRank +=
        entry.url && siteUrl.hostname.indexOf((entry.url as string).toLowerCase()) > -1 ? 0.9 : 0;
      entry.matchRank +=
        entryTitle && siteUrl.hostname.indexOf(entryTitle.toLowerCase()) > -1 ? 0.9 : 0;

      const entryTokens = getValidTokens(entryOrigins.join('.') + '.' + entryTitle);
      for (const token1 of entryTokens) {
        for (const token2 of siteTokens) {
          if (token1 == token2) {
            entry.matchRank += 0.2;
          }
        }
      }
    });
  }
}
