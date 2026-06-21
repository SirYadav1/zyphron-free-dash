<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="flex justify-center mb-4">
        <img src="/login-logo.png" alt="Zyphron Cloud" class="max-h-32 max-w-full rounded-lg object-contain animate-float" />
      </div>
      <div class="text-center space-y-3" style="animation: slideUp 0.5s ease-out 0.1s both;">
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">{{ t('auth.signIn') }}</h1>
        <p class="text-sm text-text-muted">{{ t('auth.signInSubtitle') }}</p>
      </div>

      <div class="auth-card" style="animation: slideUp 0.5s ease-out 0.2s both;">
        <!-- Maintenance Mode Banner -->
        <div v-if="maintenanceMode && !loadingMaintenance" class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Wrench :size="20" class="text-red-400" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-red-400">{{ t('auth.maintenanceTitle') }}</h3>
              <p class="text-[11px] text-red-300/80 mt-0.5">{{ t('auth.maintenanceDesc') }}</p>
            </div>
          </div>
        </div>

        <!-- Step 1: Email/Password Login -->
        <form v-if="!requires2FA" @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="store.error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ store.error }}
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.3s both;">
            <label for="email" class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">{{ t('auth.email') }}</label>
            <input
              id="email"
              v-model="email"
              type="text"
              required
              class="input-field"
              placeholder="Email or username"
            />
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.35s both;">
            <div class="flex items-center justify-between px-0.5">
              <label for="password" class="text-[11px] font-bold text-text-muted uppercase tracking-wider">{{ t('auth.password') }}</label>
              <router-link to="/forgot-password" class="text-[11px] font-bold text-accent hover:underline">{{ t('auth.forgotPassword') }}</router-link>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="input-field"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="store.loading"
            class="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            style="animation: slideUp 0.4s ease-out 0.4s both;"
          >
            {{ store.loading ? t('auth.authenticating') : t('auth.signIn') }}
            <ArrowRight v-if="!store.loading" :size="16" :stroke-width="2.5" />
            <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
          </button>
        </form>

        <!-- Step 2: 2FA Code Input -->
        <form v-else @submit.prevent="handle2FALogin" class="space-y-6">
          <div v-if="twoFAError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ twoFAError }}
          </div>

          <div class="text-center space-y-2" style="animation: scaleIn 0.4s ease-out both;">
            <div class="flex justify-center mb-2">
              <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center animate-pulse-glow">
                <ShieldCheck :size="30" :stroke-width="2" class="text-accent" />
              </div>
            </div>
            <h2 class="text-lg font-bold text-text-primary">{{ t('auth.twoFactorTitle') }}</h2>
            <p class="text-sm text-text-muted">{{ t('auth.twoFactorEnterCode') }}</p>
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.2s both;">
            <label for="totp-code" class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">{{ t('auth.verificationCode') }}</label>
            <input
              id="totp-code"
              v-model="twoFACode"
              type="text"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              required
              class="input-field text-center text-lg tracking-[0.5em]"
              placeholder="000000"
              autofocus
            />
          </div>

          <div class="flex gap-3" style="animation: slideUp 0.4s ease-out 0.3s both;">
            <button
              type="button"
              @click="cancel2FA"
              class="flex-1 py-2.5 px-4 border border-border rounded-md text-sm font-bold text-text-muted hover:bg-surface transition-colors"
            >
              {{ t('common.back') }}
            </button>
            <button
              type="submit"
              :disabled="twoFACode.length !== 6 || twoFALoading"
              class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {{ twoFALoading ? t('auth.authenticating') : t('auth.verification') }}
              <Check v-if="!twoFALoading" :size="16" :stroke-width="2.5" />
              <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
            </button>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            {{ t('auth.noAccount') }}
            <router-link to="/register" class="text-accent font-bold hover:underline">{{ t('auth.createAccount') }}</router-link>
          </p>
        </div>
      </div>

      <div class="text-center" style="animation: fadeIn 0.6s ease-out 0.5s both;">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">{{ BRAND_NAME }} • Client Area</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Check,
  Wrench,
} from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const store = useAuthStore()

const BRAND_NAME = 'Zyphron Cloud'

const email = ref('')
const password = ref('')
const requires2FA = ref(false)
const twoFACode = ref('')
const twoFALoading = ref(false)
const twoFAError = ref('')
const maintenanceMode = ref(false)
const loadingMaintenance = ref(true)

onMounted(async () => {
  try {
    const { data } = await client.get('/auth/maintenance')
    maintenanceMode.value = data.enabled
  } catch {
    // if check fails, allow login attempt (backend will enforce)
  } finally {
    loadingMaintenance.value = false
  }
})

async function handleLogin() {
  try {
    const result = await store.login(email.value, password.value)
    if (result.requires2FA) {
      requires2FA.value = true
      twoFAError.value = ''
    } else if (result.requiresEmailVerification) {
      // redirect to verification pending page with email
      sessionStorage.setItem('verify_email', result.email)
      router.push({ path: '/verify' })
    } else {
      router.push('/home')
    }
  } catch {
    // error is handled in the store
  }
}

async function handle2FALogin() {
  if (twoFACode.value.length !== 6) return
  twoFALoading.value = true
  twoFAError.value = ''
  try {
    const { data } = await client.post('/auth/login-2fa', {
      email: email.value,
      code: twoFACode.value,
    })
    if (data.requiresEmailVerification) {
      sessionStorage.setItem('verify_email', email.value)
      router.push({ path: '/verify' })
      return
    }
    sessionStorage.setItem('access_token', data.access_token)
    store.user = data.user
    router.push('/home')
  } catch (err) {
    twoFAError.value = err.response?.data?.message || 'Invalid verification code'
  } finally {
    twoFALoading.value = false
  }
}

function cancel2FA() {
  requires2FA.value = false
  twoFACode.value = ''
  twoFAError.value = ''
}
</script>
