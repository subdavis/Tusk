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

function ChromeWebStore($http, settings) {
	const statusCodes = {
		unknown: 0,
		basic: 1,
		paid: 2,
		grandFathered: 3
	};
	const origins = ["https://www.googleapis.com/"];

	var exports = {
		getLicenseStatus: getLicenseStatus,
		statusCodes: statusCodes,
		ensurePermissions: ensurePermissions
	};

	function ensurePermissions() {
		return chrome.p.permissions.request({origins: origins});
	}

	function getLicenseStatus() {
		return settings.getLicense().then(function(license) {
			if (license) 
				return license; 
			else {
				return fetchLicense();
			}
		}).then(function(license) {
			var grandfatheredTime = (new Date(2015, 8, 1)).valueOf();
			var licenseTime = parseInt(license.createdTime, 10);
			if (license.result && license.accessLevel === 'FULL')
				return statusCodes.paid;
			else if (license.result && license.accessLevel === "FREE_TRIAL" && licenseTime < grandfatheredTime)
				return statusCodes.grandFathered;
			else
				return statusCodes.basic;
		}).catch(function(err) {
			console.log(err);
			return statusCodes.unknown;
		});
	}

	function fetchLicense(dontRetry) {
		return chrome.p.identity.getAuthToken({interactive: true}).then(function(token) {
			return $http({
				url: "https://www.googleapis.com/chromewebstore/v1.1/userlicenses/" + chrome.runtime.id,
				headers: {'Authorization': 'Bearer ' + token}
			}).then(function(response) {
				settings.saveLicense(response.data);  //no need to wait for it to finish
				return response.data;
			}).catch(function(response) {
				if (response.status == 401 && !dontRetry) {
					return chrome.p.identity.removeCachedAuthToken({ token: token }).then(function() {
						fetchLicense(true);
					});
				}
				else
					throw new Error('Failed to fetch license');
			});
		});
	}

	return exports;
}
