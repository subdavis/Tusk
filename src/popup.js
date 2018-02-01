"use strict";

require('font-awesome/css/font-awesome.css')

// Require static assets we need...
require('$assets/icons/logo_38.png')
require('$assets/icons/logo_16.png')
require('$assets/icons/logo_48.png')
require('$assets/Sample123.kdbx')
require('$lib/argon2.wasm')

// Vue Components
import Vue from 'vue'
import Popup from './Popup.vue'
import VirtualRouter from '$lib/virtual-router.js'

// Set up routes
Vue.prototype.$router = new VirtualRouter()

new Vue({
	render: h => h(Popup)
}).$mount('#app')