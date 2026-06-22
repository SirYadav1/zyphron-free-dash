import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import hi from './locales/hi.js'
import es from './locales/es.js'
import ar from './locales/ar.js'
import zh from './locales/zh.js'

const savedLocale = localStorage.getItem('zyphron_locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, hi, es, ar, zh },
})

export default i18n
