"use strict";

require('font-awesome/css/font-awesome.css')
// require('materialize-css/sass/components/_variables.scss')
// require('materialize-css/sass/components/forms/_forms.scss')

// Vue Components
import Vue from 'vue'
import Popup from './Options.vue'
import VirtualRouter from '$lib/virtual-router.js'

// Set up routes
Vue.prototype.$router = new VirtualRouter()

new Vue({ 
  el: '#app',
  render: h => h(Popup)
})