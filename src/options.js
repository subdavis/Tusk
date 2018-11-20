"use strict";

require('font-awesome/css/font-awesome.css')
require('./styles/options.scss')

import VueRouter from 'vue-router'
import AsyncComputed from 'vue-async-computed'
import Vue from 'vue'
import Popup from './Options'
import store from './store'
import { options_routes } from './routes'
import { INIT } from './store/modules/database'

Vue.use(VueRouter)
Vue.use(AsyncComputed)
const router = new VueRouter({ routes: options_routes })

store.dispatch(INIT).then(() => new Vue({
	store,
	router,
	render: h => h(Popup)
}).$mount('#app'))
