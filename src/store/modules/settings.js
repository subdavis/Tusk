import { validate } from '../helpers'
/* Exported mutations */
export const FORGET_TIME_SET = '⚙️ ⌛ Set Forget Time'
export const FORGET_TIMES_CLEAR = '⚙ ️⌛ Clear Forget Times'
export const KEY_FILE_ADD = '⚙️ 🔑 Add Key File'
export const KEY_FILE_DELETE = '⚙️ 🔑 Delete Key File'
export const KEY_FILE_DELETE_ALL = '⚙️ 🔑 Delete All Key Files'
export const LAST_OPENED_SET = '⚙️ ⏲️ Set Last Opened'
export const NOTIFICATIONS_ENABLED_SET = '⚙️ Set Notifications Enabled'
export const PROVIDER_DISABLE = '⚙️ ❌ Disable Provider'
export const PROVIDER_ENABLE = '⚙️ ✔ Enable Provider'
export const USAGE_SAVE = '⚙️ 💾 Save Database Usage'
export const FREEFORM_SET = '⚙️ Set freeform value'
/* Exported getters */
export const FORGET_TIME_GET = '⚙️ Get Forget Time By Key'
export const KEY_FILE_GET = '⚙️ Get Key File By Name'
export const LAST_OPENED_GET = '⚙️ Get Last Opened File Details'
export const PROVIDER_ENABLED_GET = '⚙️ Get Provider Enabled'
/* Exported Actions */
export const UPGRADE = '⚙️ Upgrade app'

/*
 * Freeforms, not part of Vuex mutations/getters
 * These key/value pairs should be manipulated
 * ONLY through the settingsAdapter
 */
export const CLIPBOARD_EXPIRE_INTERVAL = {
	name: 'clipboardExpireInterval',
	type: 'number',
	defaultVal: 2,
}
export const ACCESS_TOKEN = {
	name: 'accessToken',
	type: 'string',
	defaultVal: '',
}
export const DEFAULT_REMEMBER_PERIOD = {
	name: 'defaultRememberPeriod',
	type: 'object',
	defaultVal: {
		time: 0,
		text: "Do not remember."
	},
}
export const HOTKEY_NAV_ENABLED = {
	name: 'hotkeyNavEnabled',
	type: 'boolean',
	defaultVal: false,
}
export const STRICT_MODE_ENABLED = {
	name: 'stricModeEnabled',
	type: 'boolean',
	defaultVal: false,
}
export const ORIGIN_PERMISSIONS_ENABLED = {
	name: 'originPermissionsEnabled',
	type: 'boolean',
	defaultVal: false,
}

/*
 * generateSettingsAdapter creates a wrapper
 * arround settings state that can be safely used from outside
 * the Vue component context, such as in services.
 * it should be used sparingly.
 */
function generateSettingsAdapter({ state, commit }) {

	const my = {}

	my.getSet = ({ name, type, defaultVal }, value) => {
		if ((value !== undefined && typeof value === type) || value === null) {
			commit({
				type: FREEFORM_SET,
				key: name,
				value: value,
			})
			return value
		} else if (value === undefined) {
			let storedVal = state.settings.freeform[name]
			if (storedVal !== undefined && typeof storedVal === type)
				return storedVal
			return defaultVal
		} else {
			return defaultVal
		}
	}

	my.getSetAccessToken = (tokenType, token) => my.getSet({
		name: tokenType + ACCESS_TOKEN.name,
		type: ACCESS_TOKEN.type,
		defaultVal: ACCESS_TOKEN.defaultVal,
	}, token)

	return my
}

/*
 * createCacheKey is simple helper, and is intended to be used 
 * only from within the vuex state modules.  Do not import this elsewhere
 */
const createCacheKey = ({ databaseFileName, providerKey }) => `${databaseFileName}.${providerKey}`

const state = {
	keyFiles: [],
	forgetTimes: {},
	lastOpened: null,
	usages: {},
	expireInterval: 2, // in minutes
	notificationsEnabledList: ['expiration', 'copy'],
	providers: [],
	freeform: {}, // Freeform keys 
}

const validators = {
	/*
	 * keyFile Model:
	 * 	name: String,
	 * 	encodedKey: String(Base64 encoded bytes),
	 */
	keyFile(item) {
		if (typeof item.name !== 'string')
			throw new Error('keyfile must have string name')
		if (typeof item.encodedKey !== 'string')
			throw new Error('Keyfile must have Base64 string encodedKey')
	},
	/*
	 * usage Model:
	 *	requiresPassword: Boolean,
	 *	requiresKeyfile: Boolean,
	 *	providerKey: String,
	 *	version: String
	 *	keyFileName: String,
	 *	rememberPeriod: Number(Minutes),
	 *  databaseFileName: String
	 *	dbInfo: Object(provider-specific schema)
	 */
	usage(item) {
		if (typeof item !== 'object')
			throw new Error('Usages must be object type')
		if (typeof item.requiresPassword !== 'boolean')
			throw new Error('usage must have boolean requiresPassword')
		if (typeof item.requiresKeyfile !== 'boolean')
			throw new Error('usage must have boolean requiresKeyfile')
		if (typeof item.providerKey !== 'string')
			throw new Error('usage must have string providerKey')
		if (typeof item.version !== 'number')
			throw new Error('usage must have number version')
		if (['string', 'object'].indexOf(typeof item.keyFileName) < 0)
			throw new Error('usage must have string keyFileName')
		if (typeof item.rememberPeriod !== 'object')
			throw new Error('usage must have object rememberPeriod')
		if (typeof item.databaseFileName !== 'string')
			throw new Error('usage must have string databaseFileName')
		if (typeof item.dbInfo !== 'object' || !item.dbInfo)
			throw new Error('usage must be object and properly defined')
	},
	/*
	 * lastOpened Model (references complete data in usages):
	 *	 databaseFileName: String
	 *	 providerKey: String,
	 */
	lastOpened(item) {
		if (typeof item.databaseFileName !== 'string')
			throw new Error('lastOpened must have string databaseFileName')
		if (typeof item.providerKey !== 'string')
			throw new Error('lastOpened must have string providerKey')
	}
}

const getters = {
	[FORGET_TIME_GET]: (state) => (key) => {
		if (key in state.forgetTimes) {
			return state.forgetTimes[key]
		}
		return null
	},
	[KEY_FILE_GET]: (state) => (name) => {
		const matches = state.keyFiles.filter(kf => {
			return kf.name === name
		})
		if (matches.length >= 1) {
			return matches[0]
		} else {
			return null
		}
	},
	[LAST_OPENED_GET]: (state) => {
		if (state.lastOpened === null)
			return null
		validate(validators, { lastOpened: state.lastOpened })
		const cacheKey = createCacheKey(state.lastOpened)
		if (cacheKey in state.usages) {
			const usage = state.usages[cacheKey]
			validate(validators, { usage })
			return usage
		} else {
			// key is missing
			return null
		}
	},
	[PROVIDER_ENABLED_GET]: (state) => (providerKey) => {
		return state.providers.includes(providerKey)
	},
}

const mutations = {

	/* keyFiles */
	[KEY_FILE_ADD](state, { name, encodedKey }) {
		const matches = state.keyFiles.filter(keyFile => {
			return keyFile.name === name
		})
		if (matches.length) {
			matches[0]['encodedKey'] = encodedKey
		} else {
			state.keyFiles.push({ name, encodedKey })
		}
	},
	[KEY_FILE_DELETE](state, { name }) {
		state.keyFiles.forEach((keyFile, index) => {
			if (keyFile.name === name) {
				state.keyFiles.splice(index, 1)
			}
		})
	},
	[KEY_FILE_DELETE_ALL](state) {
		state.keyFiles = []
	},

	/* forgetTimes */
	[FORGET_TIME_SET](state, { key, time }) {
		if (!(key in state.forgetTimes)) {
			state.forgetTimes[key] = time
		}
	},
	[FORGET_TIMES_CLEAR](state, { keys }) {
		if (!keys) {
			state.forgetTimes = {}
		} else {
			keys.forEach(k => {
				delete state.forgetTimes[k]
			})
		}
	},

	/* lastOpened */
	[LAST_OPENED_SET](state, { databaseFileName, providerKey}) {
		state.lastOpened = { databaseFileName, providerKey }
	},

	[NOTIFICATIONS_ENABLED_SET](state, { enabledList }) {
		state.notificationsEnabledList = enabledList
	},

	/* Persistent state of providers */
	[PROVIDER_DISABLE](state, { providerKey }) {
		const index = state.providers.indexOf(providerKey)
		if (index >= 0) {
			state.providers.splice(index, 1)
			if (state.lastOpened && state.lastOpened.providerKey === providerKey) {
				state.lastOpened = null
			}
		}
	},
	[PROVIDER_ENABLE](state, { providerKey }) {
		const index = state.providers.indexOf(providerKey)
		if (index === -1) {
			state.providers.push(providerKey)
		}
	},

	/* Various simple freeform key/value pairs */
	[FREEFORM_SET](state, { key, value }) {
		state.freeform[key] = value
	},

	/* usages */
	[USAGE_SAVE](state, { key, usage }) {
		validate(validators, { usage: usage })
		state.usages[key] = usage
	},

	/* ================================================================
	 * private mutations - should not be used externally
	 * ================================================================ */

	_destroy(state, { key }) {
		if (key.length > 0) {
			delete state[key]
		}
	},
}

const actions = {
	[UPGRADE]() { /* */ },
}

export {
	createCacheKey,
	generateSettingsAdapter,
	validators,
}

export default {
	state,
	getters,
	actions,
	mutations,
}
