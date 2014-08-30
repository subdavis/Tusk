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

// -----------------------------------------------------------------------------

var keepassApp = angular.module('keepassApp', []);

keepassApp.factory('gdocs', function() {
	var gdocs = new GDocs();

	return gdocs;
});
//keepassApp.service('gdocs', GDocs);
//keepassApp.controller('DocsController', ['$scope', '$http', DocsController]);

// Main Angular controller for app.
function DocsController($scope, $http, gdocs) {
	$scope.docs = [];
	$scope.fileKnown = false;
	$scope.fileOpen = false;
	
	// Response handler that caches file icons in the filesystem API.
	function successCallbackWithFsCaching(resp, status, headers, config) {
		var totalEntries = resp.items.length;

		resp.items.forEach(function(entry, i) {
			var doc = {
				title : entry.title,
				updatedDate : Util.formatDate(entry.modifiedDate),
				updatedDateFull : entry.modifiedDate,
				icon : entry.iconLink,
				url : entry.selfLink,
				size : entry.fileSize ? '( ' + entry.fileSize + ' bytes)' : null
			};

			$scope.docs.push(doc);

			// Only want to sort and call $apply() when we have all entries.
			if (totalEntries - 1 == i) {
				$scope.docs.sort(Util.sortByDate);
			}
		});
	}

	function openPasswordFile(url) {
		$scope.fileKnown = true;
		//var message = {'m': "openPasswordFile", 'url': url};
		//chrome.runtime.sendMessage(message);  //send message to background script
	}
	
	$scope.enterMasterPassword = function() {
		var typeset = {
			
		};
	};
	
	$scope.choosePasswordFile = function(url) {
		chrome.storage.sync.set({'passwordFileName': url}, function() {
			openPasswordFile(url);
		});
	};
	
	$scope.clearDocs = function() {
		$scope.docs = [];
		// Clear out old results.
	};

	$scope.fetchDocs = function(retry) {
		this.clearDocs();

		if (gdocs.accessToken) {
			var config = {
				params : {
					'alt' : 'json'
				},
				headers : {
					'Authorization' : 'Bearer ' + gdocs.accessToken
				}
			};

			$http.get(gdocs.DOCLIST_FEED + "?q=fileExtension='kdbx'", config)
			.success(successCallbackWithFsCaching)
			.error(function(data, status, headers, config) {
				if (status == 401 && retry) {
					gdocs.removeCachedAuthToken(gdocs.auth.bind(gdocs, true, $scope.fetchDocs.bind($scope, false)));
				}
			});
		}
	};

	// Toggles the authorization state.
	$scope.toggleAuth = function(interactive) {
		if (!gdocs.accessToken) {
			gdocs.auth(interactive, function() {
				$scope.fetchDocs(false);
			});
		} else {
			gdocs.revokeAuthToken(function() {
			});
			this.clearDocs();
		}
	};
	
	// Controls the label of the authorize/deauthorize button.
	$scope.authButtonLabel = function() {
		if (gdocs.accessToken)
			return 'Deauthorize';
		else
			return 'Authorize';
	};

	$scope.toggleAuth(false);
	chrome.storage.sync.get('passwordFileName', function(items) {
		if (items.passwordFileName) {
			$scope.fileKnown = true;
			$scope.fileName = items.passwordFileName;
		} 
	});		
}

DocsController.$inject = ['$scope', '$http', 'gdocs'];
// For code minifiers.

