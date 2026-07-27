import * as Base64 from 'base64-arraybuffer';
import browser from 'webextension-polyfill';
import type { DBInfo, FileManager } from './types';

export interface LocalDBInfo extends DBInfo {
  data?: string;
  storageVersion?: number;
}

export interface LocalFileManager extends FileManager {
  login(): Promise<unknown>;
  logout(): Promise<unknown>;
  isLoggedIn(): Promise<boolean>;
  listDatabases(): Promise<LocalDBInfo[]>;
  saveDatabase(db: LocalDBInfo): Promise<void>;
  deleteDatabase(db: LocalDBInfo): Promise<void>;
}

const BACKWARD_COMPATIBLE_VERSION = 1; // missing version or version less than this is ignored due missing info or bugs in old storage
const CURRENT_VERSION = 1;

class LocalChromePasswordFileManagerImpl implements LocalFileManager {
  key = 'local';
  supportedFeatures = ['incognito', 'listDatabases', 'saveDatabase', 'deleteDatabase'];
  title = 'Local Storage';
  icon = 'icon-upload';
  chooseTitle = 'File System (not recommended)';
  chooseDescription =
    "Upload files from your local or remote file-system.  A one-time copy of the file(s) will be saved in your browser's local storage.  If you update the database on your local system then you will have to re-import it in order to see the changes.";

  // ponytail: single-promise mutex, not a queue - if concurrent saves ever need to
  // interleave with more than one pending write, upgrade to a real write queue.
  private savingLock: Promise<unknown> = Promise.resolve();

  login() {
    return browser.storage.local.set({ localPasswordFilesEnabled: true });
  }

  logout() {
    return browser.storage.local.set({ localPasswordFilesEnabled: false });
  }

  async isLoggedIn(): Promise<boolean> {
    const result = await browser.storage.local.get('localPasswordFilesEnabled');
    return !!result.localPasswordFilesEnabled;
  }

  async listDatabases(): Promise<LocalDBInfo[]> {
    await this.savingLock; // wait for any in-flight save before reading
    const result = await browser.storage.local.get('passwordFiles');
    const files = (result.passwordFiles as LocalDBInfo[]) || [];
    return files.filter(
      (fi) => fi.storageVersion && fi.storageVersion >= BACKWARD_COMPATIBLE_VERSION
    );
  }

  // get the minimum information needed to identify this file for future retrieval
  getDatabaseChoiceData(dbInfo: LocalDBInfo): DBInfo {
    return { title: dbInfo.title };
  }

  // given minimal file information, retrieve the actual file
  async getChosenDatabaseFile(dbInfo: LocalDBInfo): Promise<ArrayBuffer> {
    const databases = await this.listDatabases();
    const storedFile = databases.find((f) => f.title === dbInfo.title);
    const bytes = storedFile?.data ? Base64.decode(storedFile.data) : undefined;
    if (bytes && bytes.byteLength) return bytes;
    throw new Error('Failed to find the requested file');
  }

  // save the given database to persistent storage
  async saveDatabase(db: LocalDBInfo): Promise<void> {
    db.storageVersion = CURRENT_VERSION;
    const p = this.listDatabases().then((existingFiles) => {
      const index = existingFiles.findIndex((curr) => curr.title === db.title);
      if (index === -1) {
        existingFiles.push(db);
      } else {
        existingFiles[index] = db;
      }
      return browser.storage.local.set({ passwordFiles: existingFiles });
    });
    this.savingLock = p; // ensure that a future read has to wait for the write to complete
    await p;
  }

  // remove the database from storage
  async deleteDatabase(db: LocalDBInfo): Promise<void> {
    const databases = (await this.listDatabases()).filter(
      (existing) => existing.title !== db.title
    );
    if (databases.length) {
      await browser.storage.local.set({ passwordFiles: databases });
    } else {
      await browser.storage.local.remove('passwordFiles');
    }
  }
}

export function LocalChromePasswordFileManager(): LocalFileManager {
  return new LocalChromePasswordFileManagerImpl();
}
