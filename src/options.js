"use strict";

require('font-awesome/css/font-awesome.css')

// Vue
import Vue from 'vue'
import Popup from './Options.vue'
import store from './store'
import VueRouter from 'vue-router'
// Router Views
import OptionsStartup from '@/components/OptionsStartup'
import ManageDatabases from '@/components/ManageDatabases'
import ManageKeyfiles from '@/components/ManageKeyfiles'
import AdvancedSettings from '@/components/AdvancedSettings'

Vue.use(VueRouter)

const routes = [
  { path: '/', component: OptionsStartup },
	{ path: '/manage/databases', component: ManageDatabases },
	{ path: '/manage/keyfiles', components: ManageKeyfiles },
	{ path: '/advanced', components: AdvancedSettings },
]

const router = new VueRouter({ routes })

new Vue({
	store,
	router,
	render: h => h(Popup)
}).$mount('#app')