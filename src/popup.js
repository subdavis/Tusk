"use strict";

require('font-awesome/css/font-awesome.css')

// Vue Components
import Vue from 'vue'
import Popup from './Popup.vue'
import VirtualRouter from '$lib/virtual-router.js'
import store from './store';

// Set up routes
Vue.prototype.$router = new VirtualRouter()

new Vue({
	store,
	render: h => h(Popup)
}).$mount('#app')