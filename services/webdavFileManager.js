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
const Base64 = require('base64-arraybuffer');
const createClient = require("webdav");
const regeneratorRuntime = require('babel-regenerator-runtime')
import { guid } from '$lib/utils.js'
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { create } from "domain";

const chromePromise = ChromePromiseApi()
const SEARCH_DEPTH = 5

function WebdavFileManager(settings) {
	var exports = {
		key: 'webdav',
		listDatabases: listDatabases,
		getDatabaseChoiceData: getDatabaseChoiceData,
		getChosenDatabaseFile: getChosenDatabaseFile,
		supportedFeatures: ['incognito', 'listDatabases'],
		title: 'WebDAV (beta)',
		icon: 'icon-folder',
		chooseTitle: 'WebDAV (beta)',
		chooseDescription: 'Choose a database from any WebDAV file server.  Tusk will always keep your database in sync with the server and automatically pull new versions.  WARNING: If you require username/password to use webdav, Tusk will store them unencrypted on disk.',
		login: enable,
		logout: disable,
		isLoggedIn: isEnabled,
		searchServer: searchServer,
		addServer: addServer,
		removeServer: removeServer,
		listServers: listServers
	};

	function enable() {
		return chromePromise.storage.local.set({
			'webdavEnabled': true
		})
	}

	function disable() {
		return chromePromise.storage.local.set({
			'webdavEnabled': false
		})
	}

	function isEnabled() {
		return chromePromise.storage.local.get('webdavEnabled').then(result => {
			return result.webdavEnabled || false
		})
	}

	/** 
	 * returns promise -> Object:[]DBInfo
	*/
	function listDatabases() {
		return isEnabled().then(enabled => {
			if (!enabled)
				return Promise.resolve([])
			return settings.getSetWebdavDirectoryMap().then(dirMap => {
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
		let serverInfo = await getServer(serverId)
		if (serverInfo === null) {
			console.error("serverInfo not found");
			return
		}
		let client = createClient(serverInfo.url, serverInfo.username, serverInfo.password)
		createClient.setFetchMethod(window.fetch);

		/** 
		 * returns Object:[]DirInfo
		*/
		let bfs = async function () {
			let queue = ['/']
			let foundDirectories = []

			while (queue.length) {
				let path = queue.shift()

				// TODO: Implement depth better
				if (path.split('/').length > SEARCH_DEPTH)
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
		let dirMapPromise = settings.getSetWebdavDirectoryMap()
		return Promise.all([bfsPromise, dirMapPromise]).then(resolves => {
			let foundDirectories = resolves[0]
			let dirMap = resolves[1]
			dirMap[serverInfo.serverId] = foundDirectories
			return settings.getSetWebdavDirectoryMap(dirMap)
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
		return getServer(dbInfo.serverId).then(serverInfo => {
			if (serverInfo === null)
				throw 'Database no longer exists'
			let client = createClient(serverInfo.url, serverInfo.username, serverInfo.password)
			createClient.setFetchMethod(window.fetch)
			return client.getFileContents(dbInfo.path, { credentials: 'omit' })
		})
	}

	/**
	 * Returns promise -> Object:[]DBInfo
	 * @param {string} serverId 
	 * @param {string} directory 
	 */
	function searchDirectory(serverId, directory) {
		return getServer(serverId).then(serverInfo => {
			if (serverInfo === null)
				return []
			let client = createClient(serverInfo.url, serverInfo.username, serverInfo.password)
			createClient.setFetchMethod(window.fetch);
			return client.getDirectoryContents(directory, { credentials: 'omit' }).then(contents => {
				// map from directory contents to DBInfo type.
				return contents.filter(element => {
					return element.filename.indexOf('.kdbx') >= 1
				}).map(element => {
					return {
						title: element.basename,
						path: element.filename,
						serverId: serverId
					}
				})
			})
		})
	}

	/**
	 * Return Promise --> Server GUID
	 * @param {Object:ServerInfo} serverInfo 
	 */
	function addServer(url, username, password) {
		let client = createClient(url, username, password)
		createClient.setFetchMethod((a, b) => {
			return window.fetch(a, b);
		})
		return client.getDirectoryContents('/', { credentials: 'omit' }).then(contents => {
			// success!
			let serverInfo = {
				url: url,
				username: username,
				password: password
			}
			return settings.getSetWebdavServerList().then(serverList => {
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
					return settings.getSetWebdavServerList(serverList).then(() => {
						return serverInfo
					})
				}
			})
		})
	}

	/**
	 * alias for settings.getSetWebdavServerList
	 */
	function listServers() {
		return settings.getSetWebdavServerList()
	}

	/**
	 * return Promise --> Object:ServerInfo
	 * @param {string} serverId 
	 */
	function getServer(serverId) {
		return listServers().then(serverList => {
			return serverList.filter((e, i, a) => {
				return e.serverId === serverId
			})
		}).then(matches => {
			if (matches.length === 1)
				return matches[0]
			return null
		})
	}

	/**
	 * Returns a promise --> Object:ServerInfo
	 * @param {string} serverId 
	 */
	function removeServer(serverId) {
		return settings.getSetWebdavServerList().then(servers => {
			for (var i = 0; i < servers.length; i++)
				if (servers[i].serverId === serverId)
					servers.splice(i, 1)
			return settings.getSetWebdavServerList(servers)
		}).then(() => {
			// clean up DirMap
			settings.getSetWebdavDirectoryMap().then(dirMap => {
				delete dirMap[serverId]
				return settings.getSetWebdavDirectoryMap(dirMap)
			})
		})
	}

	return exports;
}

export {
	WebdavFileManager
}