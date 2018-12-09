/* Public Mutations */
export const MESSAGES_GENERAL_SET = '👁️ Messages general set'
export const MESSAGES_UNLOCKED_SET = '👁️ Messages general set'
export const SEARCH_FILTER_SET = '👁️ Search Filter set'
export const PASSWORD_INPUT_VISIBLE_SET = '👁️ Password input visible set'

const state = {
	messages: {
		unlocked: {
			success: '',
			warn: '',
			error: '',
		},
		general: {
			success: '',
			warn: '',
			error: '',
		},
	},
	searchFilter: '',
	passwordInputVisible: false,
}

const getters = {}

const actions = {}

const mutations = {
	[MESSAGES_GENERAL_SET](state, { success = null, warn = null, error = null }) {
		if (success !== null)
			state.messages.general.success = success
		if (warn !== null)
			state.messages.general.warn = warn
		if (error !== null)
			state.messages.general.error = error
	},
	[SEARCH_FILTER_SET](state, value) {
		state.searchFilter = value
	},
	[MESSAGES_UNLOCKED_SET](state, { success = null, warn = null, error = null }) {
		if (success !== null)
			state.messages.unlocked.success = success
		if (warn !== null)
			state.messages.unlocked.warn = warn
		if (error !== null)
			state.messages.unlocked.error = error
	},
	[PASSWORD_INPUT_VISIBLE_SET](state, { visible = false }) {
		state.passwordInputVisible = visible
	},
}

export default {
	state,
	getters,
	actions,
	mutations,
}
