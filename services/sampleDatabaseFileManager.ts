import axios from 'axios';
import browser from 'webextension-polyfill';
import type { DBInfo, FileManager } from './types';

class SampleDatabaseFileManagerImpl implements FileManager {
  key = 'sample';
  supportedFeatures = ['incognito', 'listDatabases'];
  title = 'Sample';
  icon = 'icon-flask';
  chooseTitle = 'Sample Database';
  chooseDescription =
    'Sample database that you can use to try out the functionality. The master password is 123.';

  login() {
    return this.setActive(true);
  }

  logout() {
    return this.setActive(false);
  }

  isLoggedIn() {
    return this.getActive();
  }

  async listDatabases(): Promise<DBInfo[]> {
    if (await this.getActive()) {
      return [{ title: 'Sample.kdbx - password is 123' }];
    }
    return [];
  }

  // get the minimum information needed to identify this file for future retrieval
  getDatabaseChoiceData(dbInfo: DBInfo): DBInfo {
    return { title: dbInfo.title };
  }

  // given minimal file information, retrieve the actual file
  async getChosenDatabaseFile(): Promise<ArrayBuffer> {
    const response = await axios({
      method: 'GET',
      url: '/assets/other/Sample123.kdbx',
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  setActive(flag: boolean) {
    if (flag) return browser.storage.local.set({ useSampleDatabase: true });
    return browser.storage.local.remove('useSampleDatabase');
  }

  async getActive(): Promise<boolean> {
    const results = await browser.storage.local.get('useSampleDatabase');
    return !!results.useSampleDatabase;
  }
}

export function SampleDatabaseFileManager(): FileManager {
  return new SampleDatabaseFileManagerImpl();
}
