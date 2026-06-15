import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

function applyTheme() {
  const saved = localStorage.getItem('zyphron_theme') || 'dark'
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (saved === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(prefersDark ? 'dark' : 'light')
  } else {
    root.classList.add(saved)
  }
}

applyTheme()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
