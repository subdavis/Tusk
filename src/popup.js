"use strict";

require('font-awesome/css/font-awesome.css')

// Vue Components
import Vue from 'vue'
import VueRouter from 'vue-router'
import Popup from './Popup'
import store from './store';
import { popup_routes } from './routes'
import { HYDRATE } from './store/modules/database'

Vue.use(VueRouter)
const router = new VueRouter({ routes: popup_routes })

store.dispatch(HYDRATE).then(() => new Vue({
	store,
	router,
	render: h => h(Popup)
}).$mount('#app'))