/*
WebdavFileManager can interface with multiple servers and search them for
files of type *.kdbx.  It performs a full scan when the server is added,
and persists the directory names where kdbx files are found.  These choice
directories are then searched for new files at every call of listDatabases()
*/
import { AuthType, createClient } from 'webdav';
import browser from 'webextension-polyfill';
import type { Settings } from './settings';
import type { DBInfo, FileManager } from './types';

export interface ServerInfo {
  url: string;
  username: string;
  password: string;
  serverId: string;
}

export interface WebdavDBInfo extends DBInfo {
  path: string;
  serverId: string;
}

export interface DirInfo {
  path: string;
  serverId: string;
}

export type DirMap = Record<string, DirInfo[]>;

export interface WebdavFileManagerType extends FileManager {
  searchServer(serverId: string): Promise<void>;
  addServer(url: string, username: string, password: string): Promise<ServerInfo | string>;
  removeServer(serverId: string): Promise<void>;
  listServers(): Promise<ServerInfo[]>;
}

const SEARCH_DEPTH = 5;

function client(serverInfo: Pick<ServerInfo, 'url' | 'username' | 'password'>) {
  return createClient(serverInfo.url, {
    username: serverInfo.username,
    password: serverInfo.password,
    authType: AuthType.Auto,
  });
}

class WebdavFileManagerImpl implements WebdavFileManagerType {
  key = 'webdav';
  supportedFeatures = ['incognito', 'listDatabases'];
  title = 'WebDAV (beta)';
  icon = 'icon-folder';
  chooseTitle = 'WebDAV (beta)';
  chooseDescription =
    'Choose a database from any WebDAV file server.  Tusk will always keep your database in sync with the server and automatically pull new versions.  WARNING: If you require username/password to use webdav, Tusk will store them unencrypted on disk.';

  constructor(private settings: Settings) {}

  login() {
    return browser.storage.local.set({ webdavEnabled: true });
  }

  logout() {
    return browser.storage.local.set({ webdavEnabled: false });
  }

  async isLoggedIn(): Promise<boolean> {
    const result = await browser.storage.local.get('webdavEnabled');
    return !!result.webdavEnabled;
  }

  async listDatabases(): Promise<WebdavDBInfo[]> {
    if (!(await this.isLoggedIn())) return [];
    const dirMap = await this.settings.getSetWebdavDirectoryMap<DirInfo[]>();
    const results = await Promise.all(
      Object.entries(dirMap).flatMap(([serverId, dirs]) =>
        dirs.map((dirInfo) => this.searchDirectory(serverId, dirInfo.path))
      )
    );
    return results.flat();
  }

  /**
   * Find directories where keepass files are likely to exist, and save to local storage.
   */
  async searchServer(serverId: string): Promise<void> {
    const serverInfo = await this.getServer(serverId);
    if (serverInfo === null) {
      console.error('serverInfo not found');
      return;
    }
    const davClient = client(serverInfo);

    const bfs = async (): Promise<DirInfo[]> => {
      const queue = ['/'];
      const foundDirectories: DirInfo[] = [];

      while (queue.length) {
        const path = queue.shift() as string;

        // TODO: Implement depth better
        if (path.split('/').length > SEARCH_DEPTH) break; // We've exceeded search depth
        const contents = await davClient.getDirectoryContents(path);
        const items = Array.isArray(contents) ? contents : contents.data;
        let foundKDBXInDir = false;
        items.forEach((item) => {
          if (item.type === 'directory') queue.push(item.filename);
          else if (item.filename.indexOf('.kdbx') >= 1 && !foundKDBXInDir) {
            foundDirectories.push({
              path, // the parent.
              serverId: serverInfo.serverId,
            });
            foundKDBXInDir = true;
          }
        });
      }

      return foundDirectories;
    };

    const [foundDirectories, dirMap] = await Promise.all([
      bfs(),
      this.settings.getSetWebdavDirectoryMap<DirInfo[]>(),
    ]);
    dirMap[serverInfo.serverId] = foundDirectories;
    await this.settings.getSetWebdavDirectoryMap(dirMap);
  }

  // get the minimum information needed to identify this file for future retrieval
  getDatabaseChoiceData(dbInfo: WebdavDBInfo): DBInfo {
    return { serverId: dbInfo.serverId, title: dbInfo.title, path: dbInfo.path };
  }

  async getChosenDatabaseFile(dbInfo: WebdavDBInfo): Promise<ArrayBuffer> {
    const serverInfo = await this.getServer(dbInfo.serverId);
    if (serverInfo === null) throw new Error('Database no longer exists');
    const contents = await client(serverInfo).getFileContents(dbInfo.path);
    return contents as ArrayBuffer;
  }

  private async searchDirectory(serverId: string, directory: string): Promise<WebdavDBInfo[]> {
    const serverInfo = await this.getServer(serverId);
    if (serverInfo === null) return [];
    const contents = await client(serverInfo).getDirectoryContents(directory);
    const items = Array.isArray(contents) ? contents : contents.data;
    // map from directory contents to DBInfo type.
    return items
      .filter((element) => element.filename.indexOf('.kdbx') >= 1)
      .map((element) => ({
        title: element.basename,
        path: element.filename,
        serverId,
      }));
  }

  async addServer(url: string, username: string, password: string): Promise<ServerInfo | string> {
    await client({ url, username, password }).getDirectoryContents('/');
    // success!
    const serverInfo: Partial<ServerInfo> = { url, username, password };
    const serverList = await this.settings.getSetWebdavServerList<ServerInfo>();
    const matches = serverList.filter(
      (elem) =>
        elem.url == serverInfo.url &&
        elem.username == serverInfo.username &&
        elem.password == serverInfo.password
    );
    if (matches.length === 1) {
      return matches[0].serverId;
    }
    const newId = crypto.randomUUID();
    serverInfo.serverId = newId;
    serverList.push(serverInfo as ServerInfo);
    await this.settings.getSetWebdavServerList(serverList);
    return serverInfo as ServerInfo;
  }

  /** alias for settings.getSetWebdavServerList */
  listServers(): Promise<ServerInfo[]> {
    return this.settings.getSetWebdavServerList<ServerInfo>();
  }

  private async getServer(serverId: string): Promise<ServerInfo | null> {
    const serverList = await this.listServers();
    const matches = serverList.filter((e) => e.serverId === serverId);
    return matches.length === 1 ? matches[0] : null;
  }

  async removeServer(serverId: string): Promise<void> {
    const servers = await this.settings.getSetWebdavServerList<ServerInfo>();
    const remaining = servers.filter((s) => s.serverId !== serverId);
    await this.settings.getSetWebdavServerList(remaining);
    // clean up DirMap
    const dirMap = await this.settings.getSetWebdavDirectoryMap<DirInfo[]>();
    delete dirMap[serverId];
    await this.settings.getSetWebdavDirectoryMap(dirMap);
  }
}

export function WebdavFileManager(settings: Settings): WebdavFileManagerType {
  return new WebdavFileManagerImpl(settings);
}
