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
		basic: 0,
		premium: 1  //either grandfathered or purchased
	};

	var exports = {
		getLicenseStatus: getLicenseStatus
	};

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
				return statusCodes.premium;
			else if (license.result && license.accessLevel === "FREE_TRIAL" && licenseTime < grandfatheredTime)
				return statusCodes.premium;
			else
				return statusCodes.basic;
		}).catch(function(err) {
			//give some leeway, just allow it:
			console.log(err);
			return statusCodes.premium;
		});
	}

	function fetchLicense() {
		return chrome.p.permissions.request({origins: "https://www.googleapis.com/"}).then(function() {
			return chrome.p.identity.getAuthToken({interactive: true});
		}).then(function(token) {
			return $http({
				url: "https://www.googleapis.com/chromewebstore/v1.1/userlicenses/" + chrome.runtime.id,
				headers: ['Authorization', 'Bearer ' + token]
			});
		}).then(function(response) {
			settings.saveLicense(response.data);  //no need to wait for it to finish
			return response.data;
		})
	}

	return exports;
}
