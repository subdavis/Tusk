import * as Base64 from 'base64-arraybuffer';
import browser from 'webextension-polyfill';
import { toRaw } from 'vue';
import { Links } from './links';
import type { SecureCacheMemory } from './secureCacheMemory';
import type { DatabaseChoice, DBInfo, FileManager, KdbxCredentialsJSON } from './types';

const links = new Links();

export interface KeyFile {
  name: string;
  encodedKey: string;
}

interface DatabaseUsage {
  passwordKey?: KdbxCredentialsJSON;
  [key: string]: unknown;
}

async function keyGetSetter<T>(
  key: string,
  val: T | undefined,
  defaultVal: T,
  valueType: 'number' | 'string' | 'object' | 'boolean'
): Promise<T> {
  if (val !== undefined && (typeof val === valueType || val === null)) {
    console.info('Setting ' + key + ' to ', val);
    await browser.storage.local.set({ [key]: toRaw(val) });
    return val;
  }
  const oldVal = await browser.storage.local.get(key);
  if (oldVal[key] !== undefined && typeof oldVal[key] === valueType) return oldVal[key] as T;
  return defaultVal;
}

export class Settings {
  // Optional: only cacheMasterPassword/getCurrentDatabaseUsage need it. The background
  // page constructs a Settings without one (it never calls either of those methods, and
  // a SecureCacheMemory there would open a nonsensical port to itself).
  constructor(private secureCache?: SecureCacheMemory) {}

  /** upgrade old settings. Called on install. */
  async upgrade() {
    // Patch https://subdavis.com/blog/jekyll/update/2017/01/02/ckp-security-flaw.html
    const usages = await this.getSetDatabaseUsages();
    for (const key of Object.keys(usages)) {
      if (usages[key]['passwordKey'] !== undefined) {
        await browser.storage.local.clear();
        break;
      }
    }
  }

  async handleProviderError(err: Error, provider?: FileManager) {
    const info = await this.getCurrentDatabaseChoice();
    const providerKey = provider === undefined ? info?.providerKey : provider.key;
    const errmsg = err.message || '';
    if (providerKey && errmsg.indexOf('interact') >= 0) {
      // There was an error with reauthorizing google drive...
      links.openOptionsReauth(providerKey);
    }
  }

  async getKeyFiles(): Promise<KeyFile[]> {
    const items = await browser.storage.local.get(['keyFiles']);
    return (items.keyFiles as KeyFile[]) || [];
  }

  async deleteKeyFile(name: string) {
    const keyFiles = await this.getKeyFiles();
    const remaining = keyFiles.filter((keyFile) => keyFile.name !== name);
    return browser.storage.local.set({ keyFiles: remaining });
  }

  deleteAllKeyFiles() {
    return browser.storage.local.remove('keyFiles');
  }

  destroyLocalStorage(key: string) {
    if (key.length) {
      return browser.storage.local.remove(key);
    }
  }

  hardReset() {
    return browser.storage.local.clear();
  }

  async addKeyFile(name: string, key: ArrayBuffer) {
    const keyFiles = await this.getKeyFiles();
    const matches = keyFiles.filter((keyFile) => keyFile.name === name);
    const encodedKey = Base64.encode(key);
    if (matches.length) {
      // update
      matches[0].encodedKey = encodedKey;
    } else {
      // insert
      keyFiles.push({ name, encodedKey });
    }
    return browser.storage.local.set({ keyFiles });
  }

  saveCurrentDatabaseChoice(passwordFile: DBInfo, provider: FileManager) {
    const passwordFileClone: DBInfo = { ...passwordFile, data: undefined };
    return browser.storage.local.set({
      selectedDatabase: {
        passwordFile: passwordFileClone,
        providerKey: provider.key,
      },
    });
  }

  async getCurrentDatabaseChoice(): Promise<DatabaseChoice | null> {
    const items = await browser.storage.local.get(['selectedDatabase']);
    return (items.selectedDatabase as DatabaseChoice) || null;
  }

  async disableDatabaseProvider(provider: FileManager) {
    const items = await browser.storage.local.get(['selectedDatabase']);
    const selectedDatabase = items.selectedDatabase as DatabaseChoice | undefined;
    if (selectedDatabase && selectedDatabase.providerKey === provider.key) {
      return browser.storage.local.remove('selectedDatabase');
    }
    return false;
  }

  async getCurrentMasterPasswordCacheKey(): Promise<string | null> {
    const info = await this.getCurrentDatabaseChoice();
    if (info !== null) return info.passwordFile.title + '__' + info.providerKey + '.password';
    return null;
  }

  async cacheMasterPassword(passwordKey: KdbxCredentialsJSON, args: { forgetTime: number }) {
    if (!this.secureCache) throw new Error('cacheMasterPassword requires a secureCache');
    const key = await this.getCurrentMasterPasswordCacheKey();
    if (key === null) return;
    await this.secureCache.save(key, passwordKey);
    return this.setForgetTime(key, args.forgetTime);
  }

  /** Sets a time to forget something */
  async setForgetTime(key: string, time: number) {
    const storageKey = 'forgetTimes';
    const items = await browser.storage.local.get(storageKey);
    const forgetTimes = (items[storageKey] as Record<string, number>) || {};
    // only set if not exists...  This prevents us from resetting the clock every unlock...
    if (!(key in forgetTimes)) forgetTimes[key] = time;
    return browser.storage.local.set({ forgetTimes });
  }

  async getForgetTime(key: string): Promise<number | undefined> {
    const storageKey = 'forgetTimes';
    const items = await browser.storage.local.get(storageKey);
    const forgetTimes = (items[storageKey] as Record<string, number>) || {};
    return forgetTimes[key];
  }

  async getAllForgetTimes(): Promise<Record<string, number>> {
    const storageKey = 'forgetTimes';
    const items = await browser.storage.local.get(storageKey);
    return (items[storageKey] as Record<string, number>) || {};
  }

  async clearForgetTimes(keysArray: string[]) {
    const storageKey = 'forgetTimes';
    const items = await browser.storage.local.get(storageKey);
    const forgetTimes = (items[storageKey] as Record<string, number>) || {};
    keysArray.forEach((key) => {
      delete forgetTimes[key];
    });
    return browser.storage.local.set({ forgetTimes });
  }

  /**
   * Saves information about how the database was opened, so we can optimize the
   * UI next time by hiding the irrelevant options and remembering the keyfile
   */
  async saveCurrentDatabaseUsage(usage: DatabaseUsage) {
    const info = await this.getCurrentDatabaseChoice();
    if (info === null) return;
    const usages = await this.getSetDatabaseUsages();
    const key = info.passwordFile.title + '__' + info.providerKey;
    usages[key] = usage;
    return this.getSetDatabaseUsages(usages);
  }

  /**
   * Retrieves information about how the database was opened, so we can optimize the
   * UI by hiding the irrelevant options and remembering the keyfile
   */
  async getCurrentDatabaseUsage(): Promise<DatabaseUsage> {
    if (!this.secureCache) throw new Error('getCurrentDatabaseUsage requires a secureCache');
    const info = await this.getCurrentDatabaseChoice();
    if (info === null) return {};
    const usages = await this.getSetDatabaseUsages();
    const key = info.passwordFile.title + '__' + info.providerKey;
    const usage: DatabaseUsage = usages[key] || {};
    usage.passwordKey = await this.secureCache.get<KdbxCredentialsJSON>(key + '.password');
    return usage;
  }

  async getSharedUrlList(): Promise<DBInfo[] | false> {
    const items = await browser.storage.local.get('sharedUrlList');
    return (items.sharedUrlList as DBInfo[]) || false;
  }

  getSetClipboardExpireInterval(interval?: number) {
    return keyGetSetter('expireInterval', interval, 2, 'number');
  }

  getSetAccessToken(type: string, accessToken?: string | null) {
    return keyGetSetter(type + 'AccessToken', accessToken, null, 'string');
  }

  getSetDatabaseUsages(usages?: Record<string, DatabaseUsage>) {
    return keyGetSetter('databaseUsages', usages, {} as Record<string, DatabaseUsage>, 'object');
  }

  getSetDefaultRememberPeriod(rememberPeriod?: number) {
    return keyGetSetter('rememberPeriod', rememberPeriod, 0, 'number');
  }

  getSetWebdavServerList<T>(serverList?: T[]) {
    return keyGetSetter('webdavServerList', serverList, [] as T[], 'object');
  }

  getSetWebdavDirectoryMap<T>(dirMap?: Record<string, T>) {
    return keyGetSetter('webdavDirectoryMap', dirMap, {} as Record<string, T>, 'object');
  }

  getSetHotkeyNavEnabled(enabled?: boolean) {
    return keyGetSetter('hotkeyNavEnabled', enabled, false, 'boolean');
  }

  getSetStrictModeEnabled(enabled?: boolean) {
    return keyGetSetter('strictMatchModeEnabled', enabled, false, 'boolean');
  }

  getSetNotificationsEnabled(enabledTypes?: string[]) {
    return keyGetSetter(
      'notificationsEnabled',
      enabledTypes,
      ['clipboard', 'expiration'],
      'object'
    );
  }

  getSetOriginPermissionEnabled(enabled?: boolean) {
    return keyGetSetter('originPermissionsEnabled', enabled, false, 'boolean');
  }
}
