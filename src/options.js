"use strict";

import 'font-awesome/css/font-awesome.css'

// Vue Components
import { createApp } from 'vue'
import Options from './Options.vue'
import VirtualRouter from '@/lib/virtual-router.js'
import './styles/options.scss'

const app = createApp(Options)
app.config.globalProperties.$router = new VirtualRouter()
app.mount('#app')