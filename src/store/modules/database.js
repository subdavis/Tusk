/* Database State Store */

// Services
import { ChromePromiseApi } from '$lib/chrome-api-promise.js'
import { KeepassReference } from '$services/keepassReference.js'
import { KeepassService } from '$services/keepassService.js'
import { parseUrl, objectDestroy, getValidTokens } from '$lib/utils.js'
import { PasswordFileStoreRegistry } from '$services/passwordFileStore.js'
import { ProtectedMemory } from '$services/protectedMemory.js'
import { SecureCacheMemory } from '$services/secureCacheMemory'
import { Links } from '$services/links.js'
// File Managers
import { LocalChromePasswordFileManager } from '$services/localChromePasswordFileManager.js'
import { GoogleDrivePasswordFileManager } from '$services/googleDrivePasswordFileManager.js'
import { DropboxFileManager } from '$services/dropboxFileManager.js'
import { OneDriveFileManager } from '$services/oneDriveFileManager.js'
import { PCloudFileManager } from '$services/pCloudFileManager.js'
import { SharedUrlFileManager } from '$services/sharedUrlFileManager.js'
import { SampleDatabaseFileManager } from '$services/sampleDatabaseFileManager.js'
import { WebdavFileManager } from '$services/webdavFileManager.js'

/* Mutations from other modules */
import {
	DEFAULT_REMEMBER_PERIOD as SETTINGS_DEFAULT_REMEMBER_PERIOD,
	LAST_OPENED_GET as SETTINGS_LAST_OPENED_GET,
	KEY_FILE_GET as SETTINGS_KEY_FILE_GET,
	FORGET_TIME_SET as SETTINGS_FORGET_TIME_SET,
	USAGE_SAVE as SETTINGS_USAGE_SAVE,
	LAST_OPENED_SET as SETTINGS_LAST_OPENED_SET,
	STRICT_MODE_ENABLED as SETTINGS_STRICT_MODE_ENABLED,
	createCacheKey,
	generateSettingsAdapter,
} from './settings'
import {
	MESSAGES_GENERAL_SET as UI_MESSAGES_GENERAL_SET,
	MESSAGES_UNLOCKED_SET as UI_MESSAGES_UNLOCKED_SET,
} from './ui'
import {
	CACHED_ENTRIES,
} from '$services/protectedMemory'
import { validate } from '../helpers';
import { create } from 'handlebars';

// Exported mutations
export const BUSY_SET = '️🖥️ Set Busy'
export const AUTO_LOGOUT = '🖥️ Auto Log Out'
export const ACTIVE_SET = '🖥️ Set Active'
export const ACTIVE_KEY_FILE_NAME_SET = '🖥️ Set Active Key File Name'
export const DATABASE_FILE_NAME_SET = '🖥️ Set database file name'
export const MASTER_PASSWORD_SET = '🖥️ Set Master Passowrd'
export const TAB_DETAILS_SET = '🖥️ Set Tab Details'
export const REMEMBER_PERIOD_SET = '🖥️ Set Remeber Period'
// Exported getters
export const ACTIVE_CACHE_KEY_GET = '🖥️ Get Active Database Cache Key'
export const ENTRY_GET = '🖥️ Get Entry by Id'
export const DECRYPTED_ATTRIBUTE_GET = '🖥️ Get Decrypted Attribute'
// Exported actions
export const CACHE_ACTIVE_CREDENTIALS = '🖥️ cacheActiveCredentials'
export const ENTRIES_SET = '🖥️ SET all and priroity entries'
export const LOCK = '🖥️ Lock active database'
export const UNLOCK = '🖥️ Unlock Database'
export const INIT = '🖥️ Initialize Services'
export const HYDRATE = '🖥️ Hydrate database from settings and background'
export const COPY_EVENT = '🖥️ Copy event'
export const FAIL_GRACEFULLY = '🖥️ Fail Gracefully'
export const SHOW_RESULTS = '🖥️ Show Results'

const links = new Links()
const protectedMemory = new ProtectedMemory()
const backgroundCache = new SecureCacheMemory(protectedMemory)
const chromePromise = new ChromePromiseApi()
const keepassReference = new KeepassReference()
const FOREGROUND_CACHE_TIMEOUT = 2 * 60 * 1000 // 2 Minutes

export const rememberPeriodOptions = [
	{
		time: 0,
		text: "Do not remember."
	},
	{
		time: 30,
		text: "Remember for 30 min."
	},
	{
		time: 120,
		text: "Remember for 2 hours."
	},
	{
		time: 240,
		text: "Remember for 4 hours."
	},
	{
		time: 480,
		text: "Remember for 8 hours."
	},
	{
		time: 1440,
		text: "Remember for 24 hours."
	},
	{
		time: -1,
		text: "Until browser exits."
	},
]

const state = {
	ready: false, // if the database state is ready, and all necessary data has been loaded
	locked: true, // Whether or not the UI is locked.
	active: { // The last active database details.
		credentials: null, // a serialized JSON kdbxCredentials object
		databaseFileName: '',
		// Below are copied from settings/usages
		requiresPassword: true,
		requiresKeyfile: false,
		providerKey: '',
		version: NaN,
		keyFileName: null,
		dbInfo: null,
	},
	tabDetails: {
		// data from unlockedState
		tabId: '', // tab id of current tab
		url: '', // url of current tab
		title: '', // window title of current tab
		origin: '', // url of current tab without path or querystring
		sitePermission: false, // true if the extension already has rights to autofill the password
	},
	busy: true,
	masterPassword: '', // the masterPassword set in the foreground.  Erase when not in use.
	rememberPeriod: rememberPeriodOptions[0], // Do not edit attribute, rather change reference to a different item in the list.
	allEntries: [],
	priorityEntries: [],
	// more from unlockedState
	foreground_cache_timeout: null, // a timer that will automatically clear the cache
	clipboardStatus: '', // status message about clipboard, used when copying password to the clipboard
	// passthrough
	passwordFileStoreRegistry: null,
	keepassService: null,
	settingsAdapter: null,
	links,
}

const validators = {
	keyFileName(item) {
		if (item === undefined)
			throw new Error('active.keyFileName must not be undefined')
	},
	rememberPeriod(item) {
		if (typeof item.time !== 'number')
			throw new Error('rememberPeriod must have number time')
		if (typeof item.text !== 'string')
			throw new Error('rememberPeriod must have string text')
	},
}

const getters = {
	[ACTIVE_CACHE_KEY_GET]: (state) => createCacheKey(state.active),
	[ENTRY_GET]: (state) => (id) => state.allEntries.find(e => e.id === id),
	[DECRYPTED_ATTRIBUTE_GET]: (state) => (entry, key) => keepassReference.getFieldValue(entry, key, state.allEntries),
	/* Protected */
	_settings() {
		return Settings
	}
}

const mutations = {
	[ACTIVE_SET](state, {
			credentials = null,
			providerKey = '',
			keyFileName = null,
			databaseFileName = '',
			dbInfo = null }) {
		state.active.credentials = credentials
		state.active.providerKey = providerKey
		state.active.keyFileName = keyFileName
		state.active.databaseFileName = databaseFileName
		state.active.dbInfo = dbInfo
	},
	[ACTIVE_KEY_FILE_NAME_SET](state, { keyFileName }) {
		validate(validators, { keyFileName })
		state.active.keyFileName = keyFileName
	},
	[DATABASE_FILE_NAME_SET](state, { databaseFileName }) {
		state.active.databaseFileName = databaseFileName;
	},
	[BUSY_SET](state, { busy }) {
		state.busy = busy
	},
	[MASTER_PASSWORD_SET](state, { masterPassword }) {
		state.masterPassword = masterPassword
	},
	[TAB_DETAILS_SET](state, { tabId, url, title, origin, sitePermission }) {
		state.tabDetails = {
			tabId,
			url,
			title,
			origin,
			sitePermission,
		}
	},
	[AUTO_LOGOUT](state) {
		objectDestroy(state.allEntries)
		objectDestroy(state.priorityEntries)
		objectDestroy(state.active.credentials)
		state.active.credentials = null
		state.allEntries = []
		state.priorityEntries = []
		state.masterPassword = ''
	},
	[REMEMBER_PERIOD_SET](state, { time, text }) {
		validate(validators, { rememberPeriod: { time, text } })
		state.rememberPeriod = { time, text }
	},

	/* ================================================================
	 * private mutations - should not be used externally
	 * ================================================================ */

	_ready_set(state, { ready }) {
		state.ready = ready
	},
	_services_set(state, { passwordFileStoreRegistry, keepassService, settingsAdapter }) {
		state.passwordFileStoreRegistry = passwordFileStoreRegistry
		state.keepassService = keepassService
		state.settingsAdapter = settingsAdapter
	},
	_entries_set(state, { allEntries }) {
		state.allEntries = allEntries
	},
	_priority_entries_set(state, { priorityEntries }) {
		state.priorityEntries = priorityEntries
	},
	_locked_set(state, { locked }) {
		if (typeof locked !== 'boolean') {
			throw new Error('locked must be boolean')
		}
		state.locked = locked
	},
	_cache_timemout_set(state, { timeout }) {
		clearTimeout(state.foreground_cache_timeout)
		state.foreground_cache_timeout = timeout
	},
}

const actions = {
	/*
	 * Entries_set will store unlocked database entries in
	 * the FOREGROUND process, and manage the lifecycle of this
	 * sensitive data
	 */
	[ENTRIES_SET]({ commit }, allEntries, priorityEntries) {
		// Refresh cache
		// TODO: figure out a better way to have cache refresh as a side-effect of certain functions.
		const timeout = setTimeout(() => {
			commit(AUTO_LOGOUT)
		}, FOREGROUND_CACHE_TIMEOUT)
		commit('_entries_set', { allEntries, priorityEntries })
		commit('_cache_timeout_set', { timeout })
	},

	/*
	 * Copy event sets the clipboard
	 */
	[COPY_EVENT]({ commit, state }) {
		// TODO
	},

	/*
	 * Lock will trigger a state change from unlocked to locked state,
	 * And should return to a state ready to accept credentials again.
	 * It will cause credentials to be destroyed anywhere they are present.
	 */
	async [LOCK]({ commit, getters }) {
		commit(AUTO_LOGOUT)
		const cacheKey = `${getters[ACTIVE_CACHE_KEY_GET]}.kdbx.credentials`
		await backgroundCache.clear(CACHED_ENTRIES)
		await backgroundCache.clear(cacheKey)
		commit('_locked_set', { locked: true })
		// TODO:

		// this.settings.getCurrentMasterPasswordCacheKey().then(key => {
		// 	if (key !== null)
		// 		this.secureCache.clear(key)
		// })
		// this.secureCache.clear('secureCache.entries')
		// this.unlockedState.clearClipboardState()
		// this.unlockedState.clearCache() // new
	},

	/*
	 * CacheActiveCredentials will move the current active credentials
	 * into background process storage.
	 */
	async [CACHE_ACTIVE_CREDENTIALS]({ state, getters, commit }) {
		const cacheKey = `${getters[ACTIVE_CACHE_KEY_GET]}.kdbx.credentials`
		if (state.rememberPeriod.time !== 0) {
			await backgroundCache.save(cacheKey, state.active.credentials)
			if (state.rememberPeriod.time > 0) {
				const check_time = (1000 * 60 * state.rememberPeriod.time) + Date.now() // Convert min to milliseconds
				commit(SETTINGS_FORGET_TIME_SET, { cacheKey, time: check_time })
			}
		} else {
			// Erase cached credentials now
			await backgroundCache.clear(cacheKey)
		}
	},

	/*
	 * Hydrate should be called as soon as possible after
	 * application launch.  If necessary data is present, 
	 * it will auto-unlock the last opened database.
	 */
	async [HYDRATE]({ commit, getters, rootGetters, dispatch }) {
		commit(BUSY_SET, { busy: true })
		await dispatch(INIT)
		const lastOpenedDetails = rootGetters[SETTINGS_LAST_OPENED_GET]
		// TODO: Load active state from settings and memory cache.
		// TODO: Then we can get any cached secrets...  
		const cacheKey = `${createCacheKey(lastOpenedDetails)}.kdbx.credentials`
		// Load master credentials if they are cached.
		const credentialsPromise = backgroundCache.get(cacheKey)
		// Active tab details
		const tabPromise = chromePromise.tabs.query({
			active: true,
			currentWindow: true
		})
		// Resolve all promises
		const resolves = await Promise.all([credentialsPromise, tabPromise])
		const credentials = resolves[0]
		const tabs = resolves[1]

		/* Process tabs */
		if (tabs && tabs.length) {
			const tabId = tabs[0].id
			const url = tabs[0].url.split('?')
			const title = tabs[0].title
			const parsedUrl = parseUrl(tabs[0].url)
			const origin = parsedUrl.protocol + '//' + parsedUrl.hostname + '/'
			let sitePermission = false
			try {
				await chromePromise.permissions.contains({ origins: [origin] })
				sitePermission = true
			} catch (error) {
				sitePermission = false
			}
			commit(TAB_DETAILS_SET, { tabId, url, title, origin, sitePermission })
		} else {
			throw new Error('vuex: could not load tab details.')
		}
		const adapter = state.settingsAdapter
		const rememberPeriod =  adapter.getSet(SETTINGS_DEFAULT_REMEMBER_PERIOD)
		commit(REMEMBER_PERIOD_SET, rememberPeriod)
		commit(ACTIVE_SET, { ...lastOpenedDetails, credentials })

		// Unlock the database if we are able.
		// TODO

		// Finally, 
		commit(BUSY_SET, { busy: false })
		commit('_ready_set', { ready: true })
	},

	/*
	 * Show results takes the current unlocked state and
	 * renders it into messages and priority entries.
	 */
	[SHOW_RESULTS]({ state, commit }) {
		const settingsAdapter = state.settingsAdapter
		const getMatchesForThreshold = (threshold, entries_, requireEmptyURL = false) => {
			return entries_.filter(e => (e.matchRank >= threshold) && (requireEmptyURL ? !e.URL : true));
		}
		const entries = state.allEntries
		const strictMode = settingsAdapter.getSet(SETTINGS_STRICT_MODE_ENABLED)
		const siteUrl = parseUrl(state.tabDetails.url)
		const title = state.tabDetails.title
		const siteTokens = getValidTokens(`${siteUrl.hostname}.${title}`)
		state.keepassService.rankEntries(entries, siteUrl, title, siteTokens)

		let priorityEntries = getMatchesForThreshold(100, entries)

		if (priorityEntries.length == 0) {
			priorityEntries = getMatchesForThreshold(10, entries)
			// in strict mode, good matches are considered partial matches.
			if (strictMode && priorityEntries.length) {
				commit(UI_MESSAGES_UNLOCKED_SET, {
					warn: `No perfect origin matches, showing ${priorityEntries.length} partial matches.`
				})
			}
		}

		if (!strictMode && priorityEntries.length == 0) {
			priorityEntries = getMatchesForThreshold(0.8, entries, true)
		}

		if (!strictMode && priorityEntries.length == 0) {
			priorityEntries = getMatchesForThreshold(0.4, entries)
			if (priorityEntries.length) {
				commit(UI_MESSAGES_UNLOCKED_SET, {
					warn: `No perfect origin matches, showing ${priorityEntries.length} partial matches.`
				})
			}
		}
		if (priorityEntries.length == 0) {
			commit(UI_MESSAGES_UNLOCKED_SET, {
				warn: 'No matches found for this site.'
			})
		}

		commit('_priority_entries_set', { priorityEntries })
	},

	/* 
	 * Unlock assumes that all required data is already present in the database state
	 * if this is not the case, unlock will transition to an error state.
	 */
	async [UNLOCK]({ state, commit, getters, rootGetters, dispatch }) {

		commit(BUSY_SET, { busy: true })

		// load default remember period
		// load lastOpened data as active data
		// set remember Period on the UI
		// autoUnlock if required credentials are present.

		// Reset general erros
		commit(UI_MESSAGES_GENERAL_SET, { error: '' })

		const { keyFileName, dbInfo, providerKey, databaseFileName } = state.active
		const bufferPromise = state.passwordFileStoreRegistry.getChosenDatabaseFile(providerKey, dbInfo)
		const selectedKeyFile = rootGetters[SETTINGS_KEY_FILE_GET](state.active.keyFileName)

		let passwordKey
		if (state.active.credentials) {
			passwordKey = state.active.credentials
		} else {
			try {
				passwordKey = await state.keepassService.getMasterKey(state.masterPassword, selectedKeyFile)
			} catch (err) {
				dispatch(FAIL_GRACEFULLY, err)
				throw new Error(`Unreachable: should have failed gracefully: ${err.message}`)
			}
		}

		let decryptedData
		try {
			decryptedData = await state.keepassService.getDecryptedData(bufferPromise, passwordKey)
		} catch (err) {
			dispatch(FAIL_GRACEFULLY, err)
			throw new Error(`Unreachable: should have failed gracefully: ${err.message}`)
		}

		const entries = decryptedData.entries

		/* Persist entries */
		commit('_entries_set', { allEntries: entries })
		try {
			backgroundCache.save(`${getters[ACTIVE_CACHE_KEY_GET]}.all.entries`, entries)
		} catch (err) {
			dispatch(FAIL_GRACEFULLY, err)
			throw new Error(`Unreachable: should have failed gracefully: ${err.message}`)
		}
		const version = decryptedData.version
		const usage = {
			requiresPassword: passwordKey.passwordHash !== null,
			requiresKeyfile: passwordKey.keyFileHash !== null,
			version,
			keyFileName,
			rememberPeriod: state.rememberPeriod,
			dbInfo,
			providerKey,
			databaseFileName,
		}
		await dispatch(CACHE_ACTIVE_CREDENTIALS)
		commit(SETTINGS_USAGE_SAVE, { key: getters[ACTIVE_CACHE_KEY_GET], usage })
		commit(SETTINGS_LAST_OPENED_SET, { databaseFileName, providerKey })
		const settingsAdapter = state.settingsAdapter
		settingsAdapter.getSet(SETTINGS_DEFAULT_REMEMBER_PERIOD, state.rememberPeriod)
		await dispatch(SHOW_RESULTS)
		commit(MASTER_PASSWORD_SET, { masterPassword: '' })
		commit('_locked_set', { locked: false })
		commit(BUSY_SET, { busy: false })
	},

	/*
	 * Fail Unlock handles errors thrown during unlocking
	 * These include settings the UI Error Messages
	 * and reauthorization.
	 * 
	 * err should be a proper exception object
	 */
	[FAIL_GRACEFULLY]({ state, commit }, err, providerKey = null) {
		console.error(err)
		providerKey = providerKey || state.active.providerKey
		const errmsg = err.message || 'Incorrect password or keyfile'
		if (errmsg.indexOf('interact') >= 0) {
			// There was an error with reauthorizing passive token refresh
			links.openOptionsReauth(providerKey)
		} else {
			commit(UI_MESSAGES_GENERAL_SET, { error: errmsg })
		}
		commit(BUSY_SET, { busy: false })
		throw err;
	},

	/* ================================================================
	 * private actions
	 * ================================================================ */

	/*
	 * Init should be called from hydrate, 
	 * and will initialize the providers.
	 */
	async [INIT]({commit, rootState}) {
		const settings = generateSettingsAdapter({ state: rootState, commit })
		// const localChromePasswordFileManager = new LocalChromePasswordFileManager()
		const dropboxFileManager = new DropboxFileManager(settings)
		const googleDrivePasswordFileManager = new GoogleDrivePasswordFileManager(settings)
		// const sharedUrlFileManager = new SharedUrlFileManager()
		const oneDriveFileManager = new OneDriveFileManager(settings)
		const pCloudFileManager = new PCloudFileManager(settings)
		const sampleDatabaseFileManager = new SampleDatabaseFileManager(settings)
		const webdavFileManager = new WebdavFileManager()
		const passwordFileStoreRegistry = new PasswordFileStoreRegistry(
			// localChromePasswordFileManager,
			dropboxFileManager,
			googleDrivePasswordFileManager,
			// sharedUrlFileManager,
			sampleDatabaseFileManager,
			oneDriveFileManager,
			pCloudFileManager,
			webdavFileManager,
		)
		const keepassService = new KeepassService(passwordFileStoreRegistry, keepassReference)
		commit('_services_set', { passwordFileStoreRegistry, keepassService, settingsAdapter: settings })
	},
}

export default {
	state,
	getters,
	actions,
	mutations,
}
