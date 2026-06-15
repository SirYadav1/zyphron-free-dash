<template>
  <div class="auth-shell">
    <div class="max-w-md w-full space-y-8 relative z-10">
      <div v-if="loginImage" class="flex justify-center mb-4">
        <img :src="loginImage" class="max-h-32 max-w-full rounded-lg object-contain" />
      </div>
      <div v-else class="text-center space-y-3">
        <div class="flex justify-center mb-2">
          <ZyphronLogo size="lg" />
        </div>
        <h1 class="text-2xl font-bold text-text-primary tracking-tight">Welcome back</h1>
        <p class="text-sm text-text-muted">Sign in to manage your servers on Zyphron Cloud.</p>
      </div>

      <div class="auth-card">
        <!-- Step 1: Email/Password Login -->
        <form v-if="!requires2FA" @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="store.error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <span>⚠️</span> {{ store.error }}
          </div>

          <div class="space-y-1.5">
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

          <div class="space-y-1.5">
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
          >
            {{ store.loading ? 'Authenticating...' : 'Sign In' }}
            <svg v-if="!store.loading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </button>
        </form>

        <!-- Step 2: 2FA Code Input -->
        <form v-else @submit.prevent="handle2FALogin" class="space-y-6">
          <div v-if="twoFAError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">
            <span>⚠️</span> {{ twoFAError }}
          </div>

          <div class="text-center space-y-2">
            <div class="flex justify-center mb-2">
              <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>
            </div>
            <h2 class="text-lg font-bold text-text-primary">Two-Factor Authentication</h2>
            <p class="text-sm text-text-muted">Enter the 6-digit code from your authenticator app.</p>
          </div>

          <div class="space-y-1.5">
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

          <div class="flex gap-3">
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
              <svg v-if="!twoFALoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
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
      
      <div class="text-center">
        <p class="text-[10px] font-bold text-text-muted/40 uppercase tracking-[0.3em]">Zyphron Cloud • Client Area</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ZyphronLogo from '../components/ZyphronLogo.vue'
import client from '../api/client'

const router = useRouter()
const store = useAuthStore()

const email = ref('')
const password = ref('')
const loginImage = ref('')
const requires2FA = ref(false)
const twoFACode = ref('')
const twoFALoading = ref(false)
const twoFAError = ref('')

onMounted(async () => {
  try {
    // BUG-L6 FIX: Use axios client instead of raw fetch for centralized error handling
    const { data } = await client.get('/public-settings')
    if (data.login_image_url) {
      loginImage.value = data.login_image_url
    }
  } catch {
    // ignore
  }
})

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
    sessionStorage.setItem('access_token', data.access_token)  // BUG-H5 FIX
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
