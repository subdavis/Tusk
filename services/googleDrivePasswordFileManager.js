/**

The MIT License (MIT)

Copyright (c) 2015 Steven Campbell.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */

"use strict";

function GoogleDrivePasswordFileManager(gdocs) {
  var exports = {
    key: 'gdrive',
    routePath: '/choose-file',
    listDatabases: listDatabases,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    supportedFeatures: ['listDatabases'],
    title: 'Google Drive',
    icon: 'icon-google',
    chooseTitle: 'Google Drive',
    chooseDescription: 'Access password files stored on your Google Drive.  The file(s) will be fetched from Google Drive each time they are used.',
    interactiveRequestAuth: interactiveRequestAuth,
    revokeAuth: revokeAuth,
    isAuthorized: isAuthorized
  };

  function interactiveRequestAuth() {
    return gdocs.auth(true);
  }

  function revokeAuth() {
    return gdocs.revokeAuthToken();
  }

  function isAuthorized() {
    return (gdocs.accessToken) ? true : false;
  }

  function listDatabases() {
    return gdocs.auth().then(function() {
      return gdocs.getPasswordFiles(true);
    }).catch(function(err) {
      return [];
    });
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return {
      title: dbInfo.title,
      url: dbInfo.url
    }
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(databaseChoiceData) {
    return gdocs.auth().then(function() {
      return gdocs.sendXhr('GET', databaseChoiceData.url);
    }).then(function(e) {
      //this gets the file details, which we need to download the file
      var details = JSON.parse(e.currentTarget.responseText);
      var url = details.downloadUrl;
      return gdocs.sendXhr('GET', url, 'arraybuffer');
    }).then(function(e) {
      return e.currentTarget.response;
    });
  }

  return exports;
}
