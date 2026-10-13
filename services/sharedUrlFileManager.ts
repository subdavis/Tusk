import axios from 'axios';
import browser from 'webextension-polyfill';
import type { DBInfo, FileManager } from './types';

export interface SharedUrlDBInfo extends DBInfo {
  direct_link?: string;
}

export interface SharedUrlFileManagerType extends FileManager {
  login(): Promise<unknown>;
  logout(): Promise<unknown>;
  isLoggedIn(): Promise<boolean>;
  addUrl(url: SharedUrlDBInfo): Promise<void>;
  removeUrl(url: SharedUrlDBInfo): Promise<void>;
  getUrls(): Promise<SharedUrlDBInfo[]>;
}

class SharedUrlFileManagerImpl implements SharedUrlFileManagerType {
  key = 'shared-url';
  supportedFeatures = ['incognito', 'listDatabases'];
  title = 'Shared Link';
  icon = 'icon-link';
  chooseTitle = 'Shared Link';
  chooseDescription =
    'Rather than granting full access to your cloud storage provider, get a shared link and paste it in.  Any direct HTTP link will do, and Dropbox and Google Drive are supported.';

  login() {
    return browser.storage.local.set({ sharedUrlsEnabled: true });
  }

  logout() {
    return browser.storage.local.set({ sharedUrlsEnabled: false });
  }

  async isLoggedIn(): Promise<boolean> {
    const result = await browser.storage.local.get('sharedUrlsEnabled');
    return !!result.sharedUrlsEnabled;
  }

  async listDatabases(): Promise<SharedUrlDBInfo[]> {
    if (!(await this.isLoggedIn())) return [];
    return this.getUrls();
  }

  // get the minimum information needed to identify this file for future retrieval
  getDatabaseChoiceData(dbInfo: SharedUrlDBInfo): DBInfo {
    return { direct_link: dbInfo.direct_link, title: dbInfo.title };
  }

  // given minimal file information, retrieve the actual file
  async getChosenDatabaseFile(dbInfo: SharedUrlDBInfo): Promise<ArrayBuffer> {
    const response = await axios({
      method: 'GET',
      url: dbInfo.direct_link,
      responseType: 'arraybuffer',
    });
    return response.data;
  }

  async addUrl(url: SharedUrlDBInfo): Promise<void> {
    const urls = await this.getUrls();
    const index = urls.findIndex((oldUrl) => url.title === oldUrl.title);
    if (index !== -1) {
      urls[index] = url;
    } else {
      urls.push(url);
    }
    await browser.storage.local.set({ sharedUrlList: urls });
  }

  async removeUrl(url: SharedUrlDBInfo): Promise<void> {
    const urls = await this.getUrls();
    const index = urls.findIndex((oldUrl) => url.title === oldUrl.title);
    if (index !== -1) {
      urls.splice(index, 1);
    }
    if (urls.length) {
      await browser.storage.local.set({ sharedUrlList: urls });
    } else {
      await browser.storage.local.remove('sharedUrlList');
    }
  }

  async getUrls(): Promise<SharedUrlDBInfo[]> {
    const results = await browser.storage.local.get('sharedUrlList');
    return (results.sharedUrlList as SharedUrlDBInfo[]) || [];
  }
}

export function SharedUrlFileManager(): SharedUrlFileManagerType {
  return new SharedUrlFileManagerImpl();
}
