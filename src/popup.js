"use strict";

// Vue Components
import Vue from 'vue'
import Popup from './Popup.vue'
import VirtualRouter from '$lib/virtual-router.js'

// Set up routes
Vue.prototype.$router = new VirtualRouter()

new Vue({
  el: '#app',
  render: h => h(Popup)
})