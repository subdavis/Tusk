import 'font-awesome/css/font-awesome.css';

import { createApp } from 'vue';
import Popup from './Popup.vue';
import './styles/shared.scss';

document.documentElement.setAttribute('theme', 'light');

const app = createApp(Popup);
app.mount('#app');
