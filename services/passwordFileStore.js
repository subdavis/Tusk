"use strict";

/*
 * Provides a container for various storage mechanisms (aka FileManagers)that can be injected,
 * so that the rest of the code can be independent of specifics.
 **/
function PasswordFileStoreRegistry() {
	var exports = {
		listFileManagers: listFileManagers,
		getChosenDatabaseFile: getChosenDatabaseFile
	};

	//each argument is a filemanager.  To add a file manager, add it to the factory
	//for PasswordFileStoreRegistry
	var fileManagers = [];
	for (var i = 0; i < arguments.length; i++) {
		fileManagers.push(arguments[i]);
	}

	function listFileManagers(requiredFeature) {
		if (!requiredFeature) return fileManagers;

		return fileManagers.filter(function (fileManager) {
			return fileManager.supportedFeatures.indexOf(requiredFeature) > -1;
		});
	}

	function getChosenDatabaseFile(settings) {
		return settings.getCurrentDatabaseChoice().then(function (choice) {
			var matches = fileManagers.filter(function (fileManager) {
				return fileManager.key == choice.providerKey;
			});
			if (matches.length !== 1) throw new Error('Unable to find file manager for key ' + choice.providerKey);
			return matches[0].getChosenDatabaseFile(choice.passwordFile)
		});
	}

	return exports;
}

export {
	PasswordFileStoreRegistry
}