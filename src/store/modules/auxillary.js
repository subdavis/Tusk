/* Auxillary is a store for services to persist
 * implementation-specific data that will persist
 * like settings.
 */

/* Exported Mutations */
export const WEBDAV_SERVER_LIST_SET = '🔌 Set Webdav Server List'
export const WEBDAV_DIRECTORY_MAP_SET = '🔌 Set Webdav Directory Map'
/* Exported Getters */
/* Exported Actions */

const state = {
	webdavServerList: [],
	webdavDirectoryMap: {},
}

const validators = {}

const getters = {}

const mutations = {
	/* Webdav */
	[WEBDAV_DIRECTORY_MAP_SET](state, { map }) {
		state.webdavDirectoryMap = map
	},
	[WEBDAV_SERVER_LIST_SET](state, { list }) {
		state.webdavServerList = list
	},
}

const actions = {}

export default {
	state,
	getters,
	actions,
	mutations,
}
