import axios, { type AxiosResponse } from 'axios';
import { urlencode } from '@/lib/utils';
import { createOauthFileManager } from './oauthManager';
import type { Settings } from './settings';
import type { DBInfo, FileManager, OauthProviderConfig } from './types';

const accessTokenType = 'gdrive';

function getFileFromDatabase(
  dbInfo: DBInfo,
  token: string,
  attempt = 0
): Promise<AxiosResponse<ArrayBuffer>> {
  const requestMeta = {
    method: 'GET' as const,
    url: dbInfo.url,
    headers: { Authorization: 'Bearer ' + token },
  };
  return axios(requestMeta).then((response) => {
    const requestFile = {
      method: 'GET' as const,
      url: response.data.downloadUrl,
      responseType: 'arraybuffer' as const,
      headers: { Authorization: 'Bearer ' + token },
    };
    return axios(requestFile).catch((err) => {
      if (attempt === 0) {
        // sometimes the url returned returns 403 OK, because somehow it is invalid.  In this scenario, try again to get a working url
        return getFileFromDatabase(dbInfo, token, 1);
      }
      throw err;
    });
  });
}

/**
 * chrome.identity.getAuthToken is a Chrome-only extension of the identity API (no
 * webextension-polyfill/Firefox equivalent) that lets Chrome users skip the standard
 * OAuth redirect flow. Some Chromium forks advertise the API but don't implement it
 * correctly, so it's only used when none of the known-broken browsers are detected.
 */
function chromeAuth(settings: Settings, interactive: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (result) => {
      const token = result?.token;
      if (token) {
        settings.getSetAccessToken(accessTokenType, token).then(() => resolve(token));
      } else {
        const lastError = chrome.runtime.lastError;
        const message = lastError?.message ?? 'Failed to authenticate.';
        if (message === 'OAuth2 not granted or revoked.') {
          reject(new Error('You must Authorize google drive access to continue.'));
        } else {
          reject(new Error('Failed to authenticate:' + message));
        }
      }
    });
  });
}

function shouldUseChromeAuth(): boolean {
  try {
    // These browsers do not properly support chrome.identity.getAuthToken
    const isEdge = !!window.navigator.userAgent.match('Edg/');
    const isVivaldi = !!window.navigator.userAgent.match('Vivaldi');
    const isOpera = !!window.navigator.userAgent.match('OPR');
    const isArc = !!getComputedStyle(document.documentElement).getPropertyValue(
      '--arc-palette-title'
    );
    const isBrave = !!(window.navigator as Navigator & { brave?: unknown }).brave;

    return (
      typeof chrome !== 'undefined' &&
      !!chrome.identity?.getAuthToken &&
      !isVivaldi &&
      !isEdge &&
      !isOpera &&
      !isArc &&
      !isBrave
    );
  } catch {
    console.info('Firefox mobile detected.');
    return false;
  }
}

export function GoogleDrivePasswordFileManager(settings: Settings): FileManager {
  const oauth: OauthProviderConfig = {
    key: accessTokenType,
    accessTokenType,
    supportedFeatures: ['listDatabases'],
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?response_type=token&scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}`,
    origins: [
      'https://www.googleapis.com/*',
      'https://accounts.google.com/*',
      'https://*.googleusercontent.com/*',
    ],
    title: 'Google Drive',
    icon: 'icon-google',
    chooseTitle: 'Google Drive',
    chooseDescription:
      'Access password files stored on Google Drive.  Files will be fetched from Google Drive each time they are used.',

    searchRequestFunction(token: string): Promise<AxiosResponse> {
      return axios({
        method: 'GET',
        url:
          'https://www.googleapis.com/drive/v2/files?q=' +
          urlencode("fileExtension = 'kdbx' and trashed=false"),
        headers: { Authorization: 'Bearer ' + token },
      });
    },

    searchRequestHandler(response: AxiosResponse): DBInfo[] {
      return response.data.items.map((entry: { title: string; selfLink: string }) => ({
        title: entry.title,
        url: entry.selfLink,
      }));
    },

    // get the minimum information needed to identify this file for future retrieval
    getDatabaseChoiceData(dbInfo: DBInfo): DBInfo {
      return { title: dbInfo.title, url: dbInfo.url };
    },

    // given minimal file information, retrieve the actual file
    fileRequestFunction(dbInfo: DBInfo, token: string): Promise<AxiosResponse<ArrayBuffer>> {
      return getFileFromDatabase(dbInfo, token);
    },

    async revokeAuth(): Promise<void> {
      const accessToken = await settings.getSetAccessToken(accessTokenType);
      if (!accessToken) return;
      if (typeof chrome !== 'undefined' && chrome.identity?.clearAllCachedAuthTokens) {
        chrome.identity.clearAllCachedAuthTokens(() => {});
      }
      const url = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken;
      try {
        await axios({ url });
      } catch (err) {
        // Assume the request failed because the token was already bad...
        console.error(err);
      }
    },

    handleAuthRedirectURI(redirectUrl, randomState, resolve, reject) {
      const tokenMatches = /access_token=([^&]+)/.exec(redirectUrl);
      const stateMatches = /state=([^&]+)/.exec(redirectUrl);

      if (tokenMatches && stateMatches) {
        const accessToken = tokenMatches[1];
        const checkState = decodeURIComponent(stateMatches[1]);
        if (checkState === randomState) {
          settings.getSetAccessToken(accessTokenType, accessToken).then(() => {
            resolve(accessToken);
          });
        } else {
          // some sort of error or parsing failure
          reject(new Error('Auth error with state'));
          console.error('Auth error with state', redirectUrl);
        }
      } else {
        // some sort of error
        reject(new Error('Auth Error'));
        console.error('Auth Error', redirectUrl);
      }
    },
  };

  if (shouldUseChromeAuth()) {
    oauth.auth = (interactive: boolean) => chromeAuth(settings, interactive);
  }

  return createOauthFileManager(settings, oauth);
}
