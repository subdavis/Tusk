/*
WebdavFileManager can interface with multiple servers and search them for 
files of type *.kdbx.  It performas a full scan when the server is added,
and persists the directory names where kdbx files are found.  These choice
directories are then searched for new files at every call of listDatabases()
	
Object ServerInfo {
	url      string
	username string
	password string
	serverId string
}

Object DBInfo {
	path     string
	serverId string
	title    string
}

Object DirInfo {
	path     string
	serverId string
}

Object DirMap {
	"<serverId>" : []DirInfo
}

*/

const createClient = require("webdav");
import { guid } from '$lib/utils.js'
import store from '@/store'
import {
	PROVIDER_ENABLE,
	PROVIDER_DISABLE,
	PROVIDER_ENABLED_GET,
} from '@/store/modules/settings'
import {
	WEBDAV_SERVER_LIST_SET,
	WEBDAV_DIRECTORY_MAP_SET,
} from '@/store/modules/auxillary'

createClient.setFetchMethod(window.fetch);

function WebdavFileManager(search_depth = 5) {
	var exports = {
		key: 'webdav',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['incognito', 'listDatabases', 'webdav'],
		title: 'WebDAV',
		icon: 'icon-folder',
		chooseTitle: 'WebDAV',
		chooseDescription: 'Choose a database from any WebDAV file server.  Tusk will always keep your database in sync with the server and automatically pull new versions.  WARNING: If you require username/password to use webdav, Tusk will store them unencrypted on disk.',
		login: enable,
		logout: disable,
		isLoggedIn: isEnabled,
		searchServer: searchServer,
		addServer: addServer,
		removeServer: removeServer,
		listServers: listServers
	};

	function isEnabled() {
		return Promise.resolve(store.getters[PROVIDER_ENABLED_GET](exports.key))
	}

	function enable() {
		return Promise.resolve(store.commit(PROVIDER_ENABLE, { providerKey: exports.key }))
	}

	function disable() {
		return Promise.resolve(store.commit(PROVIDER_DISABLE, { providerKey: exports.key }))
	}

	/**
	 * return Object:ServerInfo
	 * @param {string} serverId 
	 */
	function getServer(serverId) {
		const serverList = listServers()
		const matches = serverList.filter(e => e.serverId === serverId)
		return matches.length ? matches[0] : null
	}

	/**
	 * @param {string} serverId 
	 * @return {object} webdavClient
	 */
	function getClient(serverId) {
		const serverInfo = getServer(serverId)
		if (serverInfo === null)
			throw new Error('Database no longer exists')
		const { url, username, password } = serverInfo
		return {
			client: createClient(url, username, password),
			serverInfo,
		}
	}

	/** 
	 * @return {Promise}
	*/
	function listDatabases() {
		return isEnabled().then(enabled => {
			if (!enabled)
				return Promise.resolve([])
			let dirMap = store.state.auxillary.webdavDirectoryMap
			let promises = []
			// For each server, for each directory in the server.
			for (let serverId in dirMap)
				dirMap[serverId].forEach(dirInfo => {
					promises.push(searchDirectory(serverId, dirInfo.path))
				})

			return Promise.all(promises).then(results => {
				// flatten results
				return [].concat.apply([], results)
			})
		})
	}

	/**
	 * Find directories where keepass files are likely to exist, 
	 * and save to local storage.  
	 * 
	 * Returns Promise -> Object:DirMap
	 * @param {string} serverId 
	 */
	async function searchServer(serverId) {
		const { client, serverInfo } = getClient(serverId)
		/** 
		 * returns Object:[]DirInfo
		 */
		let bfs = async function () {
			let queue = ['/']
			let foundDirectories = []

			while (queue.length) {
				let path = queue.shift()

				// TODO: Implement depth better
				if (path.split('/').length > search_depth)
					break; // We've exceeded search depth
				let contents = await client.getDirectoryContents(path, { credentials: 'omit' });
				let foundKDBXInDir = false;
				contents.forEach(item => {
					if (item.type === 'directory')
						queue.push(item.filename)
					else if (item.filename.indexOf('.kdbx') >= 1 && !foundKDBXInDir) {
						foundDirectories.push({
							path: path, // the parent.
							serverId: serverInfo.serverId
						})
						foundKDBXInDir = true
					}
				})
			}

			return foundDirectories
		}

		let bfsPromise = bfs()
		let dirMap = store.state.auxillary.webdavDirectoryMap
		return bfsPromise.then(foundDirectories => {
			dirMap[serverInfo.serverId] = foundDirectories
			store.commit(WEBDAV_DIRECTORY_MAP_SET, { map: dirMap })
		})
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			serverId: dbInfo.serverId,
			title: dbInfo.title,
			path: dbInfo.path
		}
	}

	/**
	 * returns promise -> ArrayBuffer
	 * @param {object:DBInfo} dbInfo 
	 */
	function getChosenDatabaseFile(dbInfo) {
		const { client } = getClient(dbInfo.serverId)
		return client.getFileContents(dbInfo.path, { credentials: 'omit' })
	}

	/**
	 * Returns promise -> Object:[]DBInfo
	 * @param {string} serverId 
	 * @param {string} directory 
	 */
	async function searchDirectory(serverId, directory) {
		const { client } = getClient(serverId)
		const contents = await client.getDirectoryContents(directory, { credentials: 'omit' })
		// map from directory contents to DBInfo type.
		return contents
			.filter(e => e.filename.indexOf('.kdbx') >= 1)
			.map(e => ({
				title: e.basename,
				path: e.filename,
				serverId,
			}))
	}

	/**
	 * Return Promise --> Server GUID
	 * @param {Object:ServerInfo} serverInfo 
	 */
	function addServer(url, username, password) {
		let client = createClient(url, username, password)
		return client.getDirectoryContents('/', { credentials: 'omit' }).then(contents => {
			// success!
			let serverInfo = {
				url: url,
				username: username,
				password: password
			}
			let serverList = listServers()
			serverList = serverList.length ? serverList : []
			let matches = serverList.filter((elem, i, a) => {
				return (elem.url == serverInfo.url
					&& elem.username == serverInfo.username
					&& elem.password == serverInfo.password)
			})
			if (matches.length == 1) {
				return matches[0].serverId
			} else {
				let newId = guid()
				serverInfo['serverId'] = newId
				serverList.push(serverInfo)
				store.commit(WEBDAV_SERVER_LIST_SET, { list: serverList })
				searchServer(newId)
				return serverInfo
			}
		})
	}

	/**
	 * alias for settings.getSetWebdavServerList
	 */
	function listServers() {
		return store.state.auxillary.webdavServerList
	}

	/**
	 * Returns Object:ServerInfo
	 * @param {string} serverId 
	 */
	function removeServer(serverId) {
		let servers = listServers()
		let removed = []
		for (var i = 0; i < servers.length; i++)
			if (servers[i].serverId === serverId)
				removed = servers.splice(i, 1)
		store.commit(WEBDAV_SERVER_LIST_SET, { list: servers })
		// clean up DirMap
		let dirMap = store.state.auxillary.webdavDirectoryMap
		delete dirMap[serverId]
		store.commit(WEBDAV_DIRECTORY_MAP_SET, { map: dirMap })
		return removed.length ? removed[0] : null
	}

	return exports;
}

export {
	WebdavFileManager
}