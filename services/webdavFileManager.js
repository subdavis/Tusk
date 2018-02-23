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

	}

	/**
	 * Returns promise --> nil when search is complete.
	 * @param {string} serverId 
	 */
	function searchServer(serverId) {
		// let serverInfo = getServer(serverId)
		// let client = createWebDAVClient(serverInfo.url, serverInfo.username, serverInfo.password)
		let client = createClient("http://coreos:9093/remote.php/webdav/", "admin", "admin")
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
					// console.log(item)
					if (item.type === 'directory')
						queue.push(item.filename)
					else if (item.filename.indexOf('.kdbx') >= 1)
						foundFiles.push(item.filename)						
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
		
	}

	/**
	 * Return Promise --> Server GUID
	 * @param {Object:ServerInfo} serverInfo 
	 */
	function addServer(url, username, password) {
		let client = createClient(url, username, password)
		createClient.setFetchMethod(window.fetch);
		return client.getDirectoryContents('/').then(contents => {
			// success!
			let serverInfo = {
				url: url,
				username: username,
				password: password
			}
			return settings.getSetWebdavServerList().then(serverList => {
				if (serverList.length){
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
				}
				return settings.getSetWebdavServerList([serverInfo])
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
		chromePromise.storage.local.get('webdavServerList').then(serverList => {
			let matches = serverList.filter((e, i, a) => {
				return e.serverId === serverId
			})
		})
	}

	/**
	 * Returns a promise --> Object:ServerInfo
	 * @param {string} serverId 
	 */
	function removeServer(serverId) {
		// TODO: implement
	}

	return exports;
}

export {
	WebdavFileManager
}