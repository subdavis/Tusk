import type { AxiosResponse } from 'axios';

export interface DBInfo {
  title: string;
  path?: string; // webdav
  serverId?: string; // webdav
  url?: string; // oauth providers, sharedUrl
  [key: string]: unknown; // duck-typed today; narrow further only if a real bug surfaces
}

export interface DatabaseChoice {
  passwordFile: DBInfo;
  providerKey: string;
}

export interface FileManager {
  key: string;
  title: string;
  icon: string;
  chooseTitle: string;
  chooseDescription: string;
  supportedFeatures: string[];
  listDatabases(): Promise<DBInfo[]>;
  getDatabaseChoiceData(dbInfo: DBInfo): DBInfo;
  getChosenDatabaseFile(dbInfo: DBInfo): Promise<ArrayBuffer>;
  login?(): Promise<unknown>;
  logout?(): Promise<unknown>;
  isLoggedIn?(): Promise<boolean>;
}

export interface OauthProviderConfig {
  key: string;
  accessTokenType: string;
  supportedFeatures: string[];
  authUrl: string;
  origins: string[];
  title: string;
  icon: string;
  chooseTitle: string;
  chooseDescription: string;
  searchRequestFunction(token: string): Promise<AxiosResponse>;
  searchRequestHandler(response: AxiosResponse): DBInfo[];
  getDatabaseChoiceData(dbInfo: DBInfo): DBInfo;
  fileRequestFunction(dbInfo: DBInfo, token: string): Promise<AxiosResponse<ArrayBuffer>>;
  revokeAuth(): Promise<void>;
  handleAuthRedirectURI(
    redirectUrl: string,
    randomState: string,
    resolve: (token: string) => void,
    reject: (err: unknown) => void
  ): void;
  auth?(interactive: boolean): Promise<string>;
}

export interface ProtectedValueJSON {
  salt: number[];
  value: number[];
}

export interface KdbxCredentialsJSON {
  passwordHash: ProtectedValueJSON | null;
  keyFileHash: ProtectedValueJSON | null;
}

/**
 * KDBX entries are a bag of dynamic fields (arbitrary custom fields become arbitrary
 * camelCased keys, tracked via `keys`) - modeled honestly rather than forced into a
 * rigid shape.
 */
export interface Entry {
  id?: string;
  groupName: string;
  groupIconId?: number;
  iconId?: number;
  tags?: string;
  searchable: boolean;
  expiry?: string;
  is_expired?: boolean;
  matchRank?: number;
  keys: string[];
  protectedData: Record<string, ProtectedValueJSON>;
  [dynamicField: string]: unknown;
}

export interface DecryptedDatabase {
  entries: Entry[];
  version: number;
}
