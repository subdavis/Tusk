const Base64 = require('base64-arraybuffer');
const createClient = require("webdav-client");
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
		supportedFeatures: ['ingognito', 'listDatabases'],
		title: 'WebDAV',
		icon: 'icon-upload',
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

	/*
	 
	Object ServerInfo {
		url string
		username string
		password string
	}

	*/

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

	function listDatabases() {
		return listServers().then(servers => {
			let promises = []
			servers.forEach(s => {
				promises.push(searchServer(s))
			})
			return Promise.all(promises).then(results => {
				// flatten results
				return [].concat.apply([], results)
			})
		})
	}

	/**
	 * Returns promise --> nil when search is complete.
	 * @param {string} serverId 
	 */
	async function searchServer(serverInfo) {
		if (!serverInfo.url || !serverInfo.username || !serverInfo.password){
			console.error("serverInfo is corrupted"); 
			return
		}
		let client = createClient(serverInfo.url, serverInfo.username, serverInfo.password)
		createClient.setFetchMethod(window.fetch);

		let bfs = async function() {
			let queue = [ '/' ]
			let foundFiles = []

			while (queue.length) {
				let path = queue.shift()

				// TODO: Implement depth better
				if (path.split('/').length > SEARCH_DEPTH) 
					break; // We've exceeded search depth
				let contents = await client.getDirectoryContents(path)
				contents.forEach(item => {
					if (item.type === 'directory')
						queue.push(item.filename)
					else if (item.filename.indexOf('.kdbx') >= 1)
						foundFiles.push({
							path: item.filename,
							title: item.filename,
							serverId: serverInfo.serverId
						})						
				})
			}

			return foundFiles
		}

		return bfs()
	}

	//get the minimum information needed to identify this file for future retrieval
	function getDatabaseChoiceData(dbInfo) {
		return {
			serverId: dbInfo.serverId,
			path: dbInfo.path
		}
	}

	//given minimal file information, retrieve the actual file
	function getChosenDatabaseFile(dbInfo) {
		getServer(dbInfo.serverId).then(serverInfo => {
			let client = createClient(serverInfo.url, serverInfo.username, serverInfo.password)
			createClient.setFetchMethod(window.fetch)
			return client.getFileContents(dbInfo.path).then(bin=> {
				console.log(bin)
			})
		})
	}

	/**
	 * Return Promise --> Server GUID
	 * @param {Object:ServerInfo} serverInfo 
	 */
	function addServer(url, username, password) {
		let client = createClient(url, username, password)
		createClient.setFetchMethod(window.fetch)
		return client.getDirectoryContents('/').then(contents => {
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
						return newId
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
		// TODO: implement
		console.log("REMOVE " + serverId)
	}

	return exports;
}

export {
	WebdavFileManager
}