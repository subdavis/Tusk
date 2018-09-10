"use strict";
const Base64 = require('base64-arraybuffer')
import axios from 'axios/dist/axios.min.js'
import {
    ChromePromiseApi
} from '$lib/chrome-api-promise.js'
import {
    OauthManager
} from '$services/oauthManager.js'

const chromePromise = ChromePromiseApi()

function PCloudFileManager(settings) {
    var accessTokenType = 'pcloud';

    var state = {
        loggedIn: false
    }

    var oauth = {
        key: accessTokenType,
        accessTokenType: accessTokenType,
        origins: ['https://*.pcloud.com/'],
        authUrl: 'https://my.pcloud.com/oauth2/authorize?response_type=token&force_reapprove=true',
        supportedFeatures: ['incognito', 'listDatabases'],
        title: 'pCloud',
        icon: 'icon-pcloud',
        chooseTitle: 'pCloud',
        chooseDescription: 'Access password files stored on pCloud. Files will be retrieved from pCould each time they are used.',
    };

    oauth.searchRequestFunction = function(token) {
        return axios({
            method: 'GET',
            url: 'https://api.pcloud.com/listfolder',
            params: {
                folderid: 0,
                recursive: 1,
                showdeleted: 0,
                nofiles: 0,
                noshares: 1,
                filtermeta: "isfolder,name,id,folderid,fileid,path"
            },
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
    }

    oauth.searchRequestHandler = function(response) {

        var walk = function(files, contents, path) {
            contents.forEach((file) => {
                if (file.isfolder) {
                    walk(files, file.contents, path + file.name + "/")
                } else {
                    file.path = path + file.name
                    files.push(file)
                }
            })
            return files
        }

        var files = walk([], response.data.metadata.contents, "/")
        return files.filter(function(fileInfo) {
            return fileInfo.name && /\.kdbx?$/.exec(fileInfo.name)
        }).map(function(fileInfo) {
            return {
                title: fileInfo.path,
                id: fileInfo.fileid
            };
        });
    }

    //get the minimum information needed to identify this file for future retrieval
    oauth.getDatabaseChoiceData = function(dbInfo) {
        return {
            title: dbInfo.title,
            id: dbInfo.id
        }
    }

    //given minimal file information, retrieve the actual file
    oauth.fileRequestFunction = function(dbInfo, token) {
        return axios({
            method: 'GET',
            url: 'https://api.pcloud.com/getfilelink',
            params: {
                path: dbInfo.title,
            },
            headers: {
                'Authorization': 'Bearer ' + token,
            },
        }).then(function(response) {
            var url = `https://${response.data.hosts[0]}${response.data.path}`
            return axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
            })
        })
    }

    oauth.revokeAuth = function() {
        return Promise.resolve()
    }

    oauth.handleAuthRedirectURI = function(redirect_url, randomState, resolve, reject) {
        function parseAuthInfoFromUrl(url) {
            var hash = /#(.+)$/.exec(url);
            if (!hash) {
                return null;
            }
            hash = hash[1];
            return JSON.parse('{"' + hash.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function(key, value) {
                return key === "" ? value : decodeURIComponent(value);
            });
        }

        var authInfo = parseAuthInfoFromUrl(redirect_url);
        if (authInfo === null) {
            reject('Failed to extract authentication information from redirect url');
        } else {
            settings.getSetAccessToken(accessTokenType, authInfo.access_token).then(function() {
                resolve(authInfo.access_token);
            });
        }
    }

    return OauthManager(settings, oauth)
}

export {
    PCloudFileManager
}