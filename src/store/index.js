import Vue from 'vue'
import Vuex from 'vuex'
// Modules
import auxillary from './modules/auxillary'
import database from './modules/database'
import ui from './modules/ui'
import settings from './modules/settings'
import background from './modules/background'
// Vuex plugins
import createLogger from 'vuex/dist/logger'
import createPersist from 'vuex-persistedstate'

Vue.use(Vuex)

const debug = process.env.NODE_ENV !== 'production'
const persistKey = 'tusk-vuex-settings'

/*
 * A Vuex Store for only the foreground applications
 */
export default new Vuex.Store({
	modules: {
		auxillary,
		database,
		settings,
		ui,
	},
	strict: debug,
	plugins: [
		createPersist({
			key: persistKey,
			paths: ['settings', 'auxillary'],
		}),
		...(debug ? [createLogger()] : []),
	],
})

/*
 * A Vuex Store for only the background page
 */
export const BackgroundStore = new Vuex.Store({
	modules: {
		settings,
		background,
	},
	strict: debug,
	plugins: [
		createPersist({
			key: persistKey,
		}),
		...(debug ? [createLogger()] : []),
	],
})