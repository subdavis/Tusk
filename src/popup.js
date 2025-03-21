"use strict";

import 'font-awesome/css/font-awesome.css'

// Vue Components
import { createApp } from 'vue'
import Popup from './Popup.vue'
import { router } from '@/lib/useRouter.js'
import './styles/shared.scss'


const app = createApp(Popup)
app.config.globalProperties.$router = router
app.mount('#app')