import axios, { type AxiosResponse } from 'axios';
import {
  createOauthFileManager,
  parseImplicitGrantHash,
  type OauthFileManager,
} from './oauthManager';
import type { Settings } from './settings';
import type { DBInfo, OauthProviderConfig } from './types';

const accessTokenType = 'pcloud';

interface PCloudFile {
  name: string;
  fileid: string;
  isfolder?: boolean;
  contents?: PCloudFile[];
  path?: string;
}

function walk(files: PCloudFile[], contents: PCloudFile[], path: string): PCloudFile[] {
  contents.forEach((file) => {
    if (file.isfolder) {
      walk(files, file.contents ?? [], path + file.name + '/');
    } else {
      file.path = path + file.name;
      files.push(file);
    }
  });
  return files;
}

export function PCloudFileManager(settings: Settings): OauthFileManager {
  const oauth: OauthProviderConfig = {
    key: accessTokenType,
    accessTokenType,
    origins: ['https://*.pcloud.com/'],
    authUrl: 'https://my.pcloud.com/oauth2/authorize?response_type=token&force_reapprove=true',
    supportedFeatures: ['incognito', 'listDatabases'],
    title: 'pCloud',
    icon: 'icon-pcloud',
    chooseTitle: 'pCloud',
    chooseDescription:
      'Access password files stored on pCloud. Files will be retrieved from pCould each time they are used.',

    searchRequestFunction(token: string): Promise<AxiosResponse> {
      return axios({
        method: 'GET',
        url: 'https://api.pcloud.com/listfolder',
        params: {
          folderid: 0,
          recursive: 1,
          showdeleted: 0,
          nofiles: 0,
          noshares: 1,
          filtermeta: 'isfolder,name,id,folderid,fileid,path',
        },
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
    },

    searchRequestHandler(response: AxiosResponse): DBInfo[] {
      const files = walk([], response.data.metadata.contents, '/');
      return files
        .filter((fileInfo) => fileInfo.name && /\.kdbx?$/.exec(fileInfo.name))
        .map((fileInfo) => ({ title: fileInfo.path as string, id: fileInfo.fileid }));
    },

    // get the minimum information needed to identify this file for future retrieval
    getDatabaseChoiceData(dbInfo: DBInfo): DBInfo {
      return { title: dbInfo.title, id: dbInfo.id };
    },

    // given minimal file information, retrieve the actual file
    async fileRequestFunction(dbInfo: DBInfo, token: string): Promise<AxiosResponse<ArrayBuffer>> {
      const response = await axios({
        method: 'GET',
        url: 'https://api.pcloud.com/getfilelink',
        params: {
          path: dbInfo.title,
        },
        headers: {
          Authorization: 'Bearer ' + token,
        },
      });
      const url = `https://${response.data.hosts[0]}${response.data.path}`;
      return axios({
        method: 'GET',
        url,
        responseType: 'arraybuffer',
      });
    },

    revokeAuth(): Promise<void> {
      return Promise.resolve();
    },

    handleAuthRedirectURI(redirectUrl, randomState, resolve, reject) {
      const authInfo = parseImplicitGrantHash(redirectUrl);
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
