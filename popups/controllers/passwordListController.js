'use strict';

function PasswordListController($scope, $element, settings, unlockedState, hotkeys) {
	$scope.settings = {};

	settings.getPasswordListIconOption().then(function(option) {
		$scope.settings.PasswordListIconOption = option;
	});

	settings.getPasswordListGroupOption().then(function(option) {
		$scope.settings.PasswordListGroupOption = option;
	});

	$scope.$watchCollection("unlockedState.entries | filter: {'filterKey': filter}", function(coll) {
		$scope.filteredEntries = coll
		$scope.selectedIndex = 0
	});

	hotkeys.bindTo($scope)
		.add({
			combo: ['down', 'tab'],
			description: 'Next entry',
			callback: nextEntry,
		})
		.add({
			combo: 'up',
			description: 'Previous entry',
			callback: prevEntry,
		})
		.add({
			combo: ['command+c', 'ctrl+c'],
			description: 'Copy entry password',
			callback: copyPassword,
		})
		.add({
			combo: 'enter',
			description: 'Fill entry password',
			callback: fillPassword,
		});

	function fixIndex() {
		let idx = $scope.selectedIndex;
		const len = $scope.filteredEntries.length;
		if (idx < 0) {
			$scope.selectedIndex = len - 1;
		} else if (idx >= len) {
			$scope.selectedIndex = 0;
		}
	}

	function nextEntry(e) {
		fixIndex();
		if ($scope.filteredEntries.length) {
			$scope.selectedIndex = ($scope.selectedIndex+1) % $scope.filteredEntries.length;
		}
		e.preventDefault();
		e.stopPropagation();
	}

	function prevEntry(e) {
		fixIndex();
		if ($scope.filteredEntries.length) {
			$scope.selectedIndex = ($scope.selectedIndex-1+$scope.filteredEntries.length) % $scope.filteredEntries.length;
		}
		e.preventDefault();
		e.stopPropagation();
	}

	function copyPassword() {
		unlockedState.copyPassword($scope.filteredEntries[$scope.selectedIndex]);
	}

	function fillPassword() {
		unlockedState.autofill($scope.filteredEntries[$scope.selectedIndex]);
	}
}
