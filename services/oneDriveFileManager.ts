import axios, { type AxiosResponse } from 'axios';
import browser from 'webextension-polyfill';
import { createOauthFileManager } from './oauthManager';
import type { Settings } from './settings';
import type { DBInfo, FileManager, OauthProviderConfig } from './types';

const accessTokenType = 'onedrive';

interface OneDriveFile {
  name: string;
  '@content.downloadUrl': string;
  parentReference?: { path: string };
}

function transformFile(file: OneDriveFile): DBInfo {
  let path = '';
  if (file.parentReference) {
    // path will be e.g. "/drive/root:/Documents"
    path = file.parentReference.path;

    // extract the part after the colon, so "/Documents"
    const split = /:(.+)$/.exec(path);
    if (split) {
      path = split[1];
    }

    if (!/\/$/.exec(path)) {
      // append trailing slash, if there was none
      path += '/';
    }
  }

  return {
    url: file['@content.downloadUrl'],
    title: path + file.name,
  };
}

export function OneDriveFileManager(settings: Settings): FileManager {
  const oauth: OauthProviderConfig = {
    key: accessTokenType,
    accessTokenType,
    authUrl:
      'https://login.live.com/oauth20_authorize.srf?response_type=token' +
      '&scope=' +
      encodeURIComponent('onedrive.readonly'),
    supportedFeatures: ['listDatabases'],
    origins: ['https://login.live.com/'],
    title: 'OneDrive',
    icon: 'icon-onedrive',
    chooseTitle: 'OneDrive',
    chooseDescription:
      'Access password files stored on OneDrive.  Files will be retrieved from OneDrive each time they are used.',

    searchRequestFunction(token: string): Promise<AxiosResponse> {
      const query = 'kdbx';
      const filter = encodeURIComponent('file ne null');
      const url =
        'https://api.onedrive.com/v1.0/drive/root/view.search?q=' + query + '&filter=' + filter;
      return axios({
        method: 'GET',
        url,
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
    },

    searchRequestHandler(response: AxiosResponse): DBInfo[] {
      if (!response) {
        throw new Error('Unable to get a response from OneDrive');
      }
      if (!response.data.value) {
        throw new Error('Unexpected response from OneDrive API');
      }

      // only return files that have a .kdbx extension
      const files = response.data.value.filter(
        (file: OneDriveFile) => file.name && /\.kdbx?$/.exec(file.name)
      );

      return files.map(transformFile);
    },

    // get the minimum information needed to identify this file for future retrieval
    getDatabaseChoiceData(dbInfo: DBInfo): DBInfo {
      return { url: dbInfo.url, title: dbInfo.title };
    },

    // given minimal file information, retrieve the actual file
    fileRequestFunction(dbInfo: DBInfo, token: string): Promise<AxiosResponse<ArrayBuffer>> {
      return axios({
        method: 'GET',
        url: dbInfo.url,
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
    },

    async revokeAuth(): Promise<void> {
      const manifest = browser.runtime.getManifest() as unknown as {
        static_data: Record<string, { client_id: string }>;
      };
      const url =
        'https://login.live.com/oauth20_logout.srf?client_id=' +
        manifest.static_data.onedrive.client_id;
      await axios.get(url);
    },

    handleAuthRedirectURI(redirectUrl, randomState, resolve, reject) {
      function parseAuthInfoFromUrl(url: string): Record<string, string> | null {
        const hashMatch = /#(.+)$/.exec(url);
        if (!hashMatch) {
          return null;
        }
        const hash = hashMatch[1];
        return JSON.parse(
          '{"' + hash.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
          (key, value) => (key === '' ? value : decodeURIComponent(value))
        );
      }

      const authInfo = parseAuthInfoFromUrl(redirectUrl);
      if (authInfo === null) {
        reject(new Error('Failed to extract authentication information from redirect url'));
      } else {
        settings.getSetAccessToken(accessTokenType, authInfo.access_token).then(() => {
          resolve(authInfo.access_token);
        });
      }
    },
  };

  return createOauthFileManager(settings, oauth);
}
