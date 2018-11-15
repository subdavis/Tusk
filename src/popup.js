"use strict";

require('font-awesome/css/font-awesome.css')

// Vue Components
import Vue from 'vue'
import Popup from './Popup'
import VirtualRouter from '$lib/virtual-router'
import store from './store';
import { HYDRATE } from './store/modules/database'

Vue.prototype.$router = new VirtualRouter()

new Vue({
	store,
	render: h => h(Popup)
}).$mount('#app')