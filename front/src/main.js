// src/main.js
import './assets/main.css'
import './styles/theme.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import '@mdi/font/css/materialdesignicons.css' // MDI 圖示字型

import vuetify from './plugins/vuetify'
const app = createApp(App)
app.use(router)
app.use(createPinia())
app.use(vuetify)
app.mount('#app')
