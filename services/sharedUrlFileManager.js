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

function SharedUrlFileManager($http, $timeout) {
  var exports = {
    key: 'shared-url',
    routePath: '/shared-url',
    listDatabases: listDatabases,
    getDatabaseChoiceData: getDatabaseChoiceData,
    getChosenDatabaseFile: getChosenDatabaseFile,
    supportedFeatures: ['incognito', 'listDatabases'],
    title: 'Shared Link',
    icon: 'icon-google',
    chooseTitle: 'Shared Link',
    chooseDescription: 'Rather than granting full access to your cloud storage provider, get a shared link and paste it in.',
    setUrls: setUrls,
    getUrls: getUrls
  };

  function listDatabases() {
  	return getUrls().then(urls => {
  		if (urls)
  			return urls;
  		return [];
  	});
  }

  //get the minimum information needed to identify this file for future retrieval
  function getDatabaseChoiceData(dbInfo) {
    return dbInfo;
  }

  //given minimal file information, retrieve the actual file
  function getChosenDatabaseFile(dbInfo, attempt) {
		return $http({
      method: 'GET',
      url: dbInfo.direct_link,
      responseType: 'arraybuffer',
      cache: true
    }).then(function(response) {
    	return response.data;
    });
  }

  function setUrls(urls){
  	if(urls)
  	  return chrome.p.storage.local.set({'sharedUrlList': urls});
  	else
  	  return chrome.p.storage.local.remove('sharedUrlList');
  }
  function getUrls(){
  	return chrome.p.storage.local.get('sharedUrlList').then(results => {
  		if (results.hasOwnProperty('sharedUrlList'))
  			return results.sharedUrlList;
  		return false;
  	});
  }

  return exports;
}
