/*
 Copyright 2012 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 Author: Eric Bidelman (ericbidelman@chromium.org)
 */

"use strict";

function GDocs(selector) {

	var SCOPE_ = 'https://www.googleapis.com/drive/v2/';

	this.lastResponse = null;

	this.__defineGetter__('SCOPE', function() {
		return SCOPE_;
	});

	this.__defineGetter__('DOCLIST_FEED', function() {
		return SCOPE_ + 'files';
	});

	this.__defineGetter__('CREATE_SESSION_URI', function() {
		return 'https://www.googleapis.com/upload/drive/v2/files?uploadType=resumable';
	});

	this.__defineGetter__('DEFAULT_CHUNK_SIZE', function() {
		return 1024 * 1024 * 5;
		// 5MB;
	});
};

GDocs.prototype.auth = function(interactive) {
  return new Promise(function(resolve, reject) {
		chrome.identity.getAuthToken({
			interactive : interactive
		}, function(token) {
			if (token) {
				GDocs.prototype.accessToken = token;
				resolve();
			}
		});
  })
};

GDocs.prototype.removeCachedAuthToken = function() {
  return new Promise(function(resolve) {
  	if (GDocs.prototype.accessToken) {
  		var accessToken = GDocs.prototype.accessToken;
  		GDocs.prototype.accessToken = null;
  		// Remove token from the token cache.
  		chrome.identity.removeCachedAuthToken({
  			token : accessToken
  		}, function() {
  			resolve();
  		});
  	} else {
  		resolve();
  	}
  });
};

GDocs.prototype.revokeAuthToken = function() {
  return new Promise(function(resolve) {
  	if (GDocs.prototype.accessToken) {
  		// Make a request to revoke token
  		var xhr = new XMLHttpRequest();
  		xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' + GDocs.prototype.accessToken);
  		xhr.send();

  		return GDocs.prototype.removeCachedAuthToken();
  	}
  });
};

GDocs.prototype.getPasswordFiles = function(retry) {
  return new Promise(function(resolve, reject) {
  	if (GDocs.prototype.accessToken) {

      var xhr = new XMLHttpRequest();
      xhr.open('GET', "https://www.googleapis.com/drive/v2/files?q=fileExtension='kdbx'");
      xhr.setRequestHeader('Authorization', 'Bearer ' + GDocs.prototype.accessToken);
      xhr.onload = function(e) {
        var resp = JSON.parse(this.response);
  		  var docs = getDocsFromResponse(resp);
  		  resolve(docs);
  		};
  		xhr.onerror = function() {
  			if (this.status == 401 && retry) {
  				return GDocs.prototype.removeCachedAuthToken().then(function() {
  				  return GDocs.prototype.getPasswordFiles(false);
  				});
  			}
  		};
      xhr.send();
  	} else {
  	  reject(new Error('Access token not present.'));
  	}
  });
}

/**
 * send a request to google drive with optional specified response type
 */
GDocs.prototype.sendXhr = function(method, url, opt_responseType) {
  return new Promise(function(resolve, reject) {
  	var xhr = new XMLHttpRequest();
  	xhr.open(method, url);
  	if (opt_responseType) {
  		xhr.responseType = opt_responseType;
  	}
  	xhr.setRequestHeader('Authorization', 'Bearer ' + GDocs.prototype.accessToken);
  	xhr.onload = resolve;
  	xhr.onerror = reject;
  	xhr.send();
  });
};

function getDocsFromResponse(resp) {
	var totalEntries = resp.items.length;
  var docs = [];

	resp.items.forEach(function(entry, i) {
		var doc = {
			title : entry.title,
			updatedDate : Util.formatDate(entry.modifiedDate),
			updatedDateFull : entry.modifiedDate,
			icon : entry.iconLink,
			url : entry.selfLink,
			size : entry.fileSize ? '( ' + entry.fileSize + ' bytes)' : null
		};

		docs.push(doc);

		if (totalEntries - 1 == i) {
			docs.sort(Util.sortByDate);
		}
	});

	return docs;
}


