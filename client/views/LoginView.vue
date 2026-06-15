<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div class="flex justify-center mb-4">
        <img src="/login-logo.png" alt="Zyphron Cloud" class="max-h-32 max-w-full rounded-lg object-contain animate-float" />
      </div>
      <div class="text-center space-y-3" style="animation: slideUp 0.5s ease-out 0.1s both;">
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p class="text-sm text-text-muted">Sign in to manage your servers on Zyphron Cloud.</p>
      </div>

      <div class="auth-card" style="animation: slideUp 0.5s ease-out 0.2s both;">
        <!-- Step 1: Email/Password Login -->
        <form v-if="!requires2FA" @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="store.error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <AlertTriangle :size="14" :stroke-width="2.5" /> {{ store.error }}
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.3s both;">
            <label for="email" class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input-field"
              placeholder="Your email address"
            />
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.35s both;">
            <div class="flex items-center justify-between px-0.5">
              <label for="password" class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Password</label>
              <a href="#" class="text-[11px] font-bold text-accent hover:underline">Forgot?</a>
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
            {{ store.loading ? 'Authenticating...' : 'Sign In' }}
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
            <h2 class="text-lg font-bold text-text-primary">Two-Factor Authentication</h2>
            <p class="text-sm text-text-muted">Enter the 6-digit code from your authenticator app.</p>
          </div>

          <div class="space-y-1.5" style="animation: slideUp 0.4s ease-out 0.2s both;">
            <label for="totp-code" class="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-0.5">Verification Code</label>
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
              Back
            </button>
            <button
              type="submit"
              :disabled="twoFACode.length !== 6 || twoFALoading"
              class="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {{ twoFALoading ? 'Verifying...' : 'Verify' }}
              <Check v-if="!twoFALoading" :size="16" :stroke-width="2.5" />
              <Loader2 v-else :size="16" :stroke-width="2.5" class="animate-spin" />
            </button>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-border text-center">
          <p class="text-sm text-text-muted font-medium">
            Don't have an account?
            <router-link to="/register" class="text-accent font-bold hover:underline">Create an account</router-link>
          </p>
        </div>
      </div>

      <div class="text-center" style="animation: fadeIn 0.6s ease-out 0.5s both;">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Zyphron Cloud • Client Area</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  AlertTriangle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-vue-next'

const router = useRouter()
const store = useAuthStore()

const email = ref('')
const password = ref('')
const requires2FA = ref(false)
const twoFACode = ref('')
const twoFALoading = ref(false)
const twoFAError = ref('')

async function handleLogin() {
  try {
    const result = await store.login(email.value, password.value)
    if (result.requires2FA) {
      requires2FA.value = true
      twoFAError.value = ''
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
