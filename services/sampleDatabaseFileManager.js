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

function SampleDatabaseFileManager($http) {
  var exports = {
    key: 'sample',
    routePath: '/sample-database',
    listDatabases: listDatabases,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    supportedFeatures: ['listDatabases'],
    supportsIngognito: true,
    title: 'Sample',
    icon: 'icon-flask',
    chooseTitle: 'Sample Database',
    chooseDescription: 'Sample database that you can use to try out the functionality.  The master password is 123.'
  };

  function listDatabases() {
    return Promise.resolve([{
      title: 'Sample.kdbx - password is 123'
    }]);
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return {
      title: dbInfo.title
    }
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(dbInfo) {
    return $http({
      method: 'GET',
      url: chrome.extension.getURL('/assets/Sample123.kdbx'),
      responseType: 'arraybuffer',
      cache: true
    }).then(function(response) {
      return response.data;
    });
  }

  return exports;
}
