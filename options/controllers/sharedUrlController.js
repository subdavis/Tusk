"use strict";

function SharedUrlController($scope, sharedUrlFileManager) {

  $scope.links = [];
  $scope.errorMessage=null;
  $scope.busy = false;

  $scope.currentUrl = "";
  $scope.currentUrlTitle = "";

  $scope.addLink = function(){
  	// try to parse the url..
		let lnk = new SharedUrl($scope.currentUrl, $scope.currentUrlTitle);
		if (lnk.isValid()){
			$scope.errorMessage = null;
			// go ahead and request permissions.  There isn't a good way to ask from the popup screen...
			$scope.busy = true;
			chrome.p.permissions.request({
	  		origins: [lnk.direct_link] //FLAGHERE TODO
	  	}).then(function(){
	  		// on accepted
	  		$scope.busy = false;
				$scope.links.push(lnk);
				$scope.$apply();
				sharedUrlFileManager.setUrls($scope.links);
	  	}, function(reason){
	  		// on rejected
	  		$scope.busy = false;
	  		$scope.errorMessage = reason.message;
	  		$scope.$apply();
	  	});
		}
  }
  $scope.removeLink = function(rmlnk){
  	for (var i = 0; i < $scope.links.length; i++){
  		let link = $scope.links[i];
  		if (link.direct_link == rmlnk.direct_link){
  			$scope.links.splice(i, 1);
  			sharedUrlFileManager.setUrls($scope.links);
  			break;
  		}
  	}
  }

  /*
   * Google File Link Object.
   */
  var SharedUrl = function(url, title){
  	this.url = url;
  	this.direct_link = url;
  	this.title = title;
  	let a = document.createElement("a"); a.href=url;
  	this.origin = a.hostname;
  	this.processSpecialSources();
  }
  SharedUrl.prototype.isValid = function(){
  	if (this.direct_link && this.title){
  		let parsed = parseUrl(this.direct_link);
  		if (parsed){
  			let lastchar = this.direct_link.charAt(this.direct_link.length-1);
  			if (lastchar != "/" && parsed.pathname.length == 1){
  				$scope.errorMessage = "URL must include file path. (eg. http://example.com is invalid, but http://example.com/file.ckp is valid.)"
  				return false;
  			}
  			return parsed.pathname.length;
  		}
  		$scope.errorMessage = "Link URL is not valid."
  	}
  	$scope.errorMessage = "Link or Title Missing";
  	return false;
  }
  // Support Google Drive, Dropbox, and any other cloud host where 
  // direct download links _can_ be made but are not the same as their
  // respective shared urls.
  SharedUrl.prototype.processSpecialSources = function(){
  	let googleGenerator = function(url){
  		let id = getParameterByName("id", url);
  		if (id)
  			return "https://docs.google.com/uc?export=download&id=" + id;
  		throw "Invalid Google Drive Shared Link";
  	};
  	let dropboxGenerator = function(url){
  		let path = url.split('/s/');
  		if (path.length != 2)
  			throw "Invalid Dropbox Shared Link";
  		return "https://dl.dropboxusercontent.com/s/" + path[1];
  	};
  	let generatorMap = {
  		"drive.google.com": googleGenerator,
  		"www.dropbox.com": dropboxGenerator
  	};
  	for (origin in generatorMap){
  		if (this.origin.toLowerCase() == origin){
  			this.direct_link = generatorMap[origin](this.url);
  			break;
  		}
  	}
  }

  /*
   * Utilities.
   * Mostly from SO.
   */

  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
  // https://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-a-url
  var parseUrl = (function () {
	  var a = document.createElement('a');
	  return function (url) {
	    a.href = url;
	    if (a.host && a.host != window.location.host)
		    return {
		      host: a.host,
		      hostname: a.hostname,
		      pathname: a.pathname,
		      port: a.port,
		      protocol: a.protocol,
		      search: a.search,
		      hash: a.hash
		    };
		  return false;
	  }
	})();

	sharedUrlFileManager.getUrls().then(urls => {
  	if (urls)
  	  $scope.links = urls;
  	$scope.$apply();
  });
}
