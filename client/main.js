import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { useBrandingStore } from './stores/branding'
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
app.use(i18n)
app.mount('#app')

// white-label branding: fetch brand name and apply to title + favicon
const brandingStore = useBrandingStore()
brandingStore.load().then(() => {
  if (brandingStore.favicon) {
    const link = document.querySelector("link[rel~='icon']")
    if (link) link.href = brandingStore.favicon
  }
})
