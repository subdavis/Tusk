import axios, { type AxiosResponse } from 'axios';
import { createOauthFileManager, type OauthFileManager } from './oauthManager';
import type { Settings } from './settings';
import type { DBInfo, OauthProviderConfig } from './types';

const accessTokenType = 'dropbox';

function httpHeaderSafeJson(v: unknown): string {
  const charsToEncode = /[\u007f-\uffff]/g;
  return JSON.stringify(v).replace(charsToEncode, (c) => {
    return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4);
  });
}

export function DropboxFileManager(settings: Settings): OauthFileManager {
  const oauth: OauthProviderConfig = {
    key: accessTokenType,
    accessTokenType,
    origins: ['https://*.dropbox.com/'],
    authUrl: 'https://www.dropbox.com/oauth2/authorize?response_type=token&force_reapprove=false',
    supportedFeatures: ['incognito', 'listDatabases'],
    title: 'Dropbox',
    icon: 'icon-dropbox',
    chooseTitle: 'Dropbox',
    chooseDescription:
      'Access password files stored on Dropbox.  Files will be retrieved from Dropbox each time they are used.',

    searchRequestFunction(token: string): Promise<AxiosResponse> {
      return axios({
        method: 'post',
        url: 'https://api.dropbox.com/2/files/search',
        data: {
          path: '',
          query: 'kdbx',
          start: 0,
          max_results: 100,
          mode: 'filename',
        },
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
    },

    searchRequestHandler(response: AxiosResponse): DBInfo[] {
      return response.data.matches.map((fileInfo: { metadata: { path_display: string } }) => ({
        title: fileInfo.metadata.path_display,
      }));
    },

    // get the minimum information needed to identify this file for future retrieval
    getDatabaseChoiceData(dbInfo: DBInfo): DBInfo {
      return { title: dbInfo.title };
    },

    // given minimal file information, retrieve the actual file
    fileRequestFunction(dbInfo: DBInfo, token: string): Promise<AxiosResponse<ArrayBuffer>> {
      return axios({
        method: 'post',
        url: 'https://api-content.dropbox.com/2/files/download',
        responseType: 'arraybuffer',
        headers: {
          Authorization: 'Bearer ' + token,
          'Dropbox-API-Arg': httpHeaderSafeJson({ path: dbInfo.title }),
        },
      });
    },

    revokeAuth(): Promise<void> {
      return Promise.resolve();
    },

    handleAuthRedirectURI(redirectUrl, randomState, resolve, reject) {
      const tokenMatches = /access_token=([^&]+)/.exec(redirectUrl);
      const stateMatches = /state=([^&]+)/.exec(redirectUrl);
      const uidMatches = /uid=(\d+)/.exec(redirectUrl);

      if (tokenMatches && stateMatches && uidMatches) {
        const accessToken = tokenMatches[1];
        const checkState = decodeURIComponent(decodeURIComponent(stateMatches[1])); // I have no idea why it is double-encoded
        if (checkState === randomState) {
          settings.getSetAccessToken(accessTokenType, accessToken).then(() => {
            resolve(accessToken);
          });
        } else {
          // some sort of error or parsing failure
          reject(new Error('state was found invalid'));
          console.error(redirectUrl, ' - state was found invalid');
        }
      } else {
        // some sort of error
        reject(new Error('redirect url was found invalid'));
        console.error(redirectUrl, ' - something was found invalid');
      }
    },
  };

  return createOauthFileManager(settings, oauth);
}
