import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import hi from './locales/hi.js'
import es from './locales/es.js'
import fr from './locales/fr.js'
import de from './locales/de.js'
import ja from './locales/ja.js'
import pt from './locales/pt.js'
import ar from './locales/ar.js'
import zh from './locales/zh.js'
import ru from './locales/ru.js'
import tr from './locales/tr.js'
import id from './locales/id.js'

const savedLocale = localStorage.getItem('zyphron_locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, hi, es, fr, de, ja, pt, ar, zh, ru, tr, id },
})

export default i18n
