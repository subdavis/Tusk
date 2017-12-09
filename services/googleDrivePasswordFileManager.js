import axios from 'axios/dist/axios.min.js'
let Base64 = require('base64-arraybuffer')
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { urlencode } from '$lib/utils.js'

const chromePromise = ChromePromiseApi()

function GoogleDrivePasswordFileManager(settings) {
	"use strict";

  var accessTokenType = "gdrive"
  var state = {
    loggedIn: false
  }
  var exports = {
    key: 'gdrive',
    listDatabases: listDatabasesSafe,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    interactiveLogin: auth,
    supportedFeatures: ['listDatabases'],
    permissions: [
      "https://www.googleapis.com/*",
      "https://accounts.google.com/*",
      "https://*.googleusercontent.com/*",
    ],
    title: 'Google Drive',
    icon: 'icon-google',
    chooseTitle: 'Google Drive',
    chooseDescription: 'Access password files stored on your Google Drive.  The file(s) will be fetched from Google Drive each time they are used.',
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    ensureGoogleUrlPermissions: ensureGoogleUrlPermissions
  };

  function listDatabasesSafe() {
    return settings.getAccessToken(accessTokenType).then(function(stored_token) {
      if (stored_token) {
        return listDatabases();
      } else {
        return [];
      }
    });
  }

  function listDatabases() {
    var url = "https://www.googleapis.com/drive/v2/files?q=" +
      urlencode("fileExtension = 'kdbx' and trashed=false");
    return googleDriveGet(url).then(function(data) {
      return data.items.map(function(entry) {
        return {
          title : entry.title,
          url : entry.selfLink
        };
      });
    });
  }

  function isLoggedIn () {
    return settings.getAccessToken(accessTokenType).then(stored_token => {
      return !!stored_token
    })
  }

  function login() {
    return auth(true);
  }

  function logout() {
    return revokeAuth().then(nil => {
      state.loggedIn = false;
      return removeToken()
    })
  }

  //revoke the oauth2 token on the oauth2 server
  function revokeAuth() {
    return ensureGoogleUrlPermissions().then(nil => {
      settings.getAccessToken(accessTokenType).then(function(accessToken) {
        if (accessToken) {
          var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + accessToken
          return axios({
            url: url, 
            responseType: 'jsonp'
          }).then(function(response) {
            return removeToken();
          }).catch(err => {
            // Assume the request failed because the token was already bad...
            console.error(err)
            return removeToken();
          })
        } else {
          return Promise.resolve();
        }
      })
    })
  }

  function getToken() {
    return settings.getAccessToken(accessTokenType).then(function(stored_token) {
      if (stored_token) {
        state.loggedIn = true;
        return stored_token;
      }
      return auth(false).then(new_token => {
        return new_token;
      })
    })
  }

  function removeToken () {
    return settings.saveAccessToken(accessTokenType, null);
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(databaseChoiceData, attempt) {
    return googleDriveGet(databaseChoiceData.url).then(function(details) {
      //the first url just gets us the file details, which we use to download the file
      return googleDriveGet(details.downloadUrl, 'arraybuffer');
    }).then(data => {
      return data;
    }).catch(err => {
      attempt = attempt || 0;
      if (attempt == 0) {
        //sometimes the url returned returns 403 OK, because somehow it is invalid.  In this scenario, try again to get a working url
        return getChosenDatabaseFile(databaseChoiceData, 1);
      } else {
        throw err
      }
    });
  }

  //sends an authorized request to google drive, including retry
  //(retry is necessary because local cached token may get out of sync, then we need a new one)
  function googleDriveGet(url, optionalResponseType, attempt) {
    return ensureGoogleUrlPermissions().then(ensured => {
      attempt = attempt || 0;
      var rateLimits = [1, 2, 4, 8, 16];
      return getToken().then(function(accessToken) {
        var request = {
          method: 'GET',
          url: url,
          headers: {
            'Authorization': 'Bearer ' + accessToken
          }
        };
        if (optionalResponseType)
          request.responseType = optionalResponseType;

        return axios(request)
          .then(response => { return response.data })
          .catch(response => {
            if (response.status == 401 && attempt < 2) {
              return removeToken().then(nil => {
                return googleDriveGet(url, optionalResponseType, attempt + 1);
              });
            } else if (response.status == 403 && attempt < rateLimits.length) {
              //rate limited, retry
              var message = (optionalResponseType == 'arraybuffer') ? new Uint8Array(response.data) : response.data;
              console.log('403, retrying', url, response.statusText, message);
              return setTimeout(function() {
                return googleDriveGet(url, optionalResponseType, attempt + 1);
              }, rateLimits[attempt] + Math.floor(Math.random() * 1000));
            } else {
              console.log('failed to fetch', url, accessToken, response);
              throw new Error("Request to retrieve files from drive failed - " + (response.statusText || response.message))
            }
          });
      });
    });
  }

  function ensureGoogleUrlPermissions() {
    var origins = [
      "https://www.googleapis.com/*",
      "https://accounts.google.com/*",
      "https://*.googleusercontent.com/*",
    ];
    return chromePromise.permissions.contains({origins: origins}).catch(function() {
      console.log("DIDN:T HAVE")
      return chromePromise.permissions.request({origins: origins}).catch( function() {
        var err = chrome.runtime.lastError;
        console.error(err);
        return(new Error('User denied access to google docs urls'));
      });
    });
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return {
      title: dbInfo.title,
      url: dbInfo.url
    }
  }

  function auth(interactive) {
    interactive = !!interactive;
    console.info("Beginning new interactive Login session")
    return ensureGoogleUrlPermissions().then(ensured => {
      return new Promise(function(resolve, reject) {
        chromePromise.runtime.getManifest().then(manifest => {
          var randomState = Base64.encode(window.crypto.getRandomValues(new Uint8Array(16)));  //random state, protects against CSRF
          var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + manifest.static_data.gdrive.client_id
            + '&scope=' + encodeURIComponent('https://www.googleapis.com/auth/drive.readonly')
            + '&response_type=token'
            + '&state=' + encodeURIComponent(randomState)
            + '&redirect_uri=' + encodeURIComponent(chrome.identity.getRedirectURL('gdrive'));
          console.log(authUrl)
          chromePromise.identity.launchWebAuthFlow({'url': authUrl, 'interactive': interactive}).then(function(redirect_url) {
            console.log("After", redirect_url);
            var tokenMatches = /access_token=([^&]+)/.exec(redirect_url);
            var stateMatches = /state=([^&]+)/.exec(redirect_url);

            if (tokenMatches && stateMatches) {
              var access_token = tokenMatches[1];
              var checkState = decodeURIComponent(stateMatches[1]);
              if (checkState === randomState) {
                state.loggedIn = true;
                settings.saveAccessToken(accessTokenType, access_token).then(function() {
                  resolve(access_token);
                });
              } else {
                //some sort of error or parsing failure
                reject(redirect_url);
                console.error("Auth error", redirect_url);
              }
            } else {
              //some sort of error
              reject(redirect_url)
              console.error("Auth Error", redirect_url);
            }
          }).catch(function(err) {
            console.error(err);
            reject(err);
          });
        });
      });
    });
  }

  return exports;
}

export { GoogleDrivePasswordFileManager }