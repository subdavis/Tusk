function LicenseController($scope, chromeWebStore) {

	chromeWebStore.getLicenseStatus().then(function(status) {
		$scope.$apply(function() {
			$scope.status = status;
		});
	});

	$scope.checkLicense = function() {
		chromeWebStore.ensurePermissions().then(function() {
			return chromeWebStore.getLicenseStatus();
		}).then(function(status) {
			$scope.$apply(function() {
				$scope.status = status;
			});
		})
	}
}
