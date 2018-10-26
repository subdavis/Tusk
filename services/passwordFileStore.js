/*
 * Provides a container for various storage mechanisms (aka FileManagers) that can be injected,
 * so that the rest of the code can be independent of specifics.
 */
function PasswordFileStoreRegistry(links) {

	var my = { links };

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

	my.handleProviderError = (providerKey, err) => {
		let errmsg = err.message || ""
		if (errmsg.indexOf('interact') >= 0) {
			/* There was an error with reauthorizing */
			links.openOptionsReauth(providerKey)
		}
	}

	return my;
}

export { PasswordFileStoreRegistry };
