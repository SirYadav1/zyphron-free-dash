<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ t('preferences.preferences') }}</h2>
      <p class="text-sm text-text-muted">{{ t('preferences.customizeExp') }}</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">{{ t('common.loading') }}</p>
    </div>

    <div v-if="successMsg" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold">
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold">
      {{ errorMsg }}
    </div>

    <form @submit.prevent="handleSave" class="space-y-8">
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">{{ t('preferences.appPreferences') }}</h3>
          <p class="text-sm text-text-muted">{{ t('preferences.customizeExp') }}</p>
        </div>

        <div class="space-y-1.5">
          <label for="locale" class="text-label">{{ t('preferences.languageLocale') }}</label>
          <select id="locale" v-model="prefs.locale" @change="switchLocale" class="input-field">
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="es">Español (Spanish)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="zh">中文 (Chinese)</option>
          </select>
          <p class="text-[11px] text-text-muted mt-2">{{ t('preferences.languageDesc') }}</p>
        </div>

        <div class="space-y-1.5">
          <label class="text-label">{{ t('preferences.theme') }}</label>
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" v-model="prefs.theme" value="dark" class="hidden" />
              <div :class="prefs.theme === 'dark' ? 'bg-accent border-accent' : 'bg-base border-border group-hover:border-border-bright'" class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all">
                <div v-if="prefs.theme === 'dark'" class="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span class="text-sm font-medium text-text-primary">{{ t('preferences.dark') }}</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" v-model="prefs.theme" value="light" class="hidden" />
              <div :class="prefs.theme === 'light' ? 'bg-accent border-accent' : 'bg-base border-border group-hover:border-border-bright'" class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all">
                <div v-if="prefs.theme === 'light'" class="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span class="text-sm font-medium text-text-primary">{{ t('preferences.light') }}</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" v-model="prefs.theme" value="system" class="hidden" />
              <div :class="prefs.theme === 'system' ? 'bg-accent border-accent' : 'bg-base border-border group-hover:border-border-bright'" class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all">
                <div v-if="prefs.theme === 'system'" class="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <span class="text-sm font-medium text-text-primary">{{ t('preferences.system') }}</span>
            </label>
          </div>
          <p class="text-[11px] text-text-muted mt-2">{{ t('preferences.themeDesc') }}</p>
        </div>
      </div>

      <div class="pt-6 border-t border-border flex items-center justify-between">
        <p class="text-xs text-text-muted font-medium">{{ t('preferences.savedToAccount') }}</p>
        <div class="flex items-center gap-3">
          <button type="submit" :disabled="saving" class="btn-primary px-10">
            {{ saving ? t('common.loading') : t('preferences.savePreferences') }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import client from '../api/client'

const { t, locale } = useI18n()

const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const savedTheme = localStorage.getItem('zyphron_theme') || 'dark'
const prefs = reactive({
  locale: localStorage.getItem('zyphron_locale') || 'en',
  theme: savedTheme,
})

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.add(prefersDark ? 'dark' : 'light')
  } else {
    root.classList.add(theme)
  }
  localStorage.setItem('zyphron_theme', theme)
}

function switchLocale() {
  locale.value = prefs.locale
  localStorage.setItem('zyphron_locale', prefs.locale)
  document.documentElement.lang = prefs.locale
}

// Apply theme immediately on load
applyTheme(savedTheme)

watch(() => prefs.theme, (newTheme) => {
  applyTheme(newTheme)
})

onMounted(async () => {
  try {
    const { data } = await client.get('/preferences')
    if (data.locale) {
      prefs.locale = data.locale
      locale.value = data.locale
      document.documentElement.lang = data.locale
    }
    if (data.theme) prefs.theme = data.theme
  } catch {
    // Use localStorage defaults
  } finally {
    loading.value = false
    applyTheme(prefs.theme)
  }
})

async function handleSave() {
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await client.put('/preferences', {
      locale: prefs.locale,
      theme: prefs.theme,
    })
    localStorage.setItem('zyphron_locale', prefs.locale)
    localStorage.setItem('zyphron_theme', prefs.theme)
    successMsg.value = 'Preferences saved successfully.'
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to save preferences'
  } finally {
    saving.value = false
  }
}
</script>
