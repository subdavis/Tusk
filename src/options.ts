import 'font-awesome/css/font-awesome.css';

import { createApp } from 'vue';
import Options from './Options.vue';
import './styles/options.scss';

document.documentElement.setAttribute('theme', 'light');

const app = createApp(Options);
app.mount('#app');
