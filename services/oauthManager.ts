import axios from 'axios';
import * as Base64 from 'base64-arraybuffer';
import browser from 'webextension-polyfill';
import { hasOriginPermission } from '@/lib/utils';
import type { Settings } from './settings';
import type { DBInfo, FileManager, OauthProviderConfig } from './types';

export interface OauthFileManager extends FileManager {
  login(): Promise<unknown>;
  logout(): Promise<unknown>;
  isLoggedIn(): Promise<boolean>;
  getToken(): Promise<string | undefined>;
}

/**
 * Parses the `#access_token=...&...` implicit-grant hash fragment OneDrive and pCloud
 * both redirect back with into a plain object, decoding each value.
 */
export function parseImplicitGrantHash(url: string): Record<string, string> | null {
  const hashMatch = /#(.+)$/.exec(url);
  if (!hashMatch) {
    return null;
  }
  const hash = hashMatch[1];
  return JSON.parse('{"' + hash.replace(/&/g, '","').replace(/=/g, '":"') + '"}', (key, value) =>
    key === '' ? value : decodeURIComponent(value)
  );
}

async function ensureOriginPermissions(origins: string[]): Promise<boolean> {
  if (await hasOriginPermission(origins)) return true;
  try {
    return await browser.permissions.request({ origins });
  } catch {
    return false;
  }
}

/**
 * Decorates an OauthProviderConfig (the per-provider auth/search/download hooks) into
 * a full FileManager, adding shared login/logout/token-refresh/retry behavior.
 */
export function createOauthFileManager(
  settings: Settings,
  oauth: OauthProviderConfig
): OauthFileManager {
  const accessTokenType = oauth.accessTokenType;
  const state = { loggedIn: false };

  async function getToken(): Promise<string | undefined> {
    const ensured = await ensureOriginPermissions(oauth.origins);
    if (!ensured) return undefined;
    const storedToken = await settings.getSetAccessToken(accessTokenType);
    if (storedToken) {
      state.loggedIn = true;
      return storedToken;
    }
    return auth(false); // try passive auth if there's no token...
  }

  function removeToken() {
    return settings.getSetAccessToken(accessTokenType, null);
  }

  /** lists databases if a token is already stored */
  async function listDatabasesSafe(): Promise<DBInfo[]> {
    const storedToken = await settings.getSetAccessToken(accessTokenType);
    if (!storedToken) return [];
    return listDatabases();
  }

  async function getDatabases(): Promise<DBInfo[]> {
    const token = await getToken();
    const response = await oauth.searchRequestFunction(token as string);
    return oauth.searchRequestHandler(response);
  }

  async function listDatabases(attempt = 0): Promise<DBInfo[]> {
    try {
      return await getDatabases();
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if (attempt > 0) {
        if (oauth.key === 'gdrive' && typeof chrome !== 'undefined') {
          // If the gdrive token is bad, clear all cached auth tokens.
          // chrome.identity.clearAllCachedAuthTokens is a Chrome-only extension of the
          // identity API with no webextension-polyfill/Firefox equivalent.
          chrome.identity.clearAllCachedAuthTokens(() => {});
        }
        throw error;
      }

      if (status !== undefined && status >= 400 && status <= 599) {
        console.error('listDatabases failed with status code', status);
        // unauthorized or forbidden, means the token is bad.  retry with new token.
        await new Promise((resolve) => setTimeout(resolve, 400)); // Wait 400 MS before trying again
        console.info('First attempt to listDatabases failed, waiting....');
        await auth(false); // try passive auth if something failed.
        return listDatabases(1);
      } else if (!status) {
        throw new Error('Network Connection Error');
      }
      return [];
    }
  }

  function login() {
    return auth(true);
  }

  async function isLoggedIn(): Promise<boolean> {
    return state.loggedIn;
  }

  async function logout() {
    await oauth.revokeAuth();
    await removeToken();
    state.loggedIn = false;
  }

  /** given minimal file information, retrieve the actual file */
  async function getChosenDatabaseFile(dbInfo: DBInfo): Promise<ArrayBuffer> {
    const accessToken = await getToken();
    try {
      const response = await oauth.fileRequestFunction(dbInfo, accessToken as string);
      return response.data;
    } catch (error) {
      console.error('Get chosen file failure:', error);
      if (!axios.isAxiosError(error) || error.response === undefined)
        throw new Error('No network connection');
      if (error.response.status == 401) {
        // unauthorized, means the token is bad.  retry with new token.
        console.error(
          'Stale token sent for ' + oauth.accessTokenType + ': trying passive Oauth Refresh.'
        );
        await auth(false);
        return getChosenDatabaseFile(dbInfo);
      }
      throw error;
    }
  }

  async function auth(interactive: boolean): Promise<string | undefined> {
    interactive = !!interactive;
    console.info('Authenticating for ', oauth.accessTokenType, interactive);

    const defaultAuthFunction = async (isInteractive: boolean): Promise<string> => {
      const manifest = browser.runtime.getManifest() as unknown as {
        static_data: Record<string, { client_id: string }>;
      };
      // random state, protects against CSRF
      const randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)).buffer);
      const authUrl =
        oauth.authUrl +
        '&client_id=' +
        manifest.static_data[oauth.accessTokenType].client_id +
        '&state=' +
        encodeURIComponent(randomState) +
        '&redirect_uri=' +
        encodeURIComponent(browser.identity.getRedirectURL(oauth.accessTokenType));
      console.info('Sending request for AUTH to', oauth.authUrl);
      const redirectUrl = await browser.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: isInteractive,
      });
      return new Promise<string>((resolve, reject) => {
        oauth.handleAuthRedirectURI(redirectUrl, randomState, resolve, reject);
      });
    };

    // If the oauth provider has chosen to implement its own auth function.
    const authFunction = oauth.auth ?? defaultAuthFunction;

    const ensured = await ensureOriginPermissions(oauth.origins);
    if (!ensured) return undefined;
    const token = await authFunction(interactive);
    if (token) {
      console.info('Successfully logged into', oauth.accessTokenType);
      state.loggedIn = true;
    }
    return token;
  }

  return {
    key: accessTokenType,
    listDatabases: listDatabasesSafe,
    getDatabaseChoiceData: oauth.getDatabaseChoiceData,
    getChosenDatabaseFile,
    supportedFeatures: ['incognito', 'listDatabases'],
    title: oauth.title,
    icon: oauth.icon,
    chooseTitle: oauth.chooseTitle,
    chooseDescription: oauth.chooseDescription,
    login,
    isLoggedIn,
    logout,
    getToken,
  };
}
