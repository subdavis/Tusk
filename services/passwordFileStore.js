/*
 * Provides a container for various storage mechanisms (aka FileManagers) that can be injected,
 * so that the rest of the code can be independent of specifics.
 */
function PasswordFileStoreRegistry() {

	var my = {};

	/* 
	 * each argument is a filemanager.  
	 * To add a file manager, add it to the factory
	 * for PasswordFileStoreRegistry
	 */
	var fileManagers = [];
	for (var i = 0; i < arguments.length; i++) {
		fileManagers.push(arguments[i]);
	}

	my.listFileManagers = (requiredFeature) => {
		if (!requiredFeature) {
			return fileManagers;
		}
		return fileManagers.filter( fileManager => 
			fileManager.supportedFeatures.indexOf(requiredFeature) > -1
		);
	}

	my.getChosenDatabaseFile = (providerKey, dbInfo) => {
		var matches = fileManagers.filter(fileManager =>
			fileManager.key === providerKey
		);
		if (matches.length !== 1) {
			throw new Error('Unable to find file manager for key ' + providerKey);
		}
		return matches[0].getChosenDatabaseFile(dbInfo);
	}

	return my;
}

export default PasswordFileStoreRegistry;
