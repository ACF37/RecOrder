import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { registerSW } from 'virtual:pwa-register'

if (typeof window !== 'undefined') {
	registerSW({ immediate: true })
}

createApp(App).use(router).mount('#app')
